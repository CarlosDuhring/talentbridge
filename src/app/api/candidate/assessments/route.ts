import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai";
import { buildCandidateContext, upsertSkill } from "@/lib/scoring";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

const schema = z.object({
  skill: z.string().min(1).max(80),
  questionCount: z.number().int().min(1).max(20).optional(),
});

export async function GET() {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const context = await buildCandidateContext(session.profile.id);
  if (!context) return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });

  const assessed = await prisma.skillScore.findMany({
    where: { candidateId: session.profile.id },
    include: { skill: true },
  });
  const assessedMap = new Map(assessed.map((s) => [s.skill.name, s.score]));

  const skills = context.skills.map((s) => ({
    name: s.name,
    category: s.category,
    source: s.source,
    score: assessedMap.get(s.name) ?? null,
  }));

  return NextResponse.json({ skills });
}

export async function POST(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Escolha uma competência para avaliar." },
      { status: 400 }
    );
  }

  const context = await buildCandidateContext(session.profile.id);
  if (!context) return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });

  if (context.skills.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nenhuma competência identificada ainda. Envie seu currículo ou cadastre experiências e projetos antes de gerar a avaliação.",
      },
      { status: 400 }
    );
  }

  const chosen = context.skills.find((s) => s.name === parsed.data.skill);
  if (!chosen) {
    return NextResponse.json(
      { error: "Competência não encontrada no seu perfil." },
      { status: 400 }
    );
  }

  const ai = getAIProvider();
  const draft = await ai.generateAssessment(context, {
    skill: chosen.name,
    questionCount: parsed.data.questionCount ?? 10,
  });

  if (draft.items.length === 0) {
    return NextResponse.json(
      { error: "Não foi possível gerar questões para esta competência." },
      { status: 400 }
    );
  }

  const assessment = await prisma.assessment.create({
    data: {
      candidateId: session.profile.id,
      title: draft.title,
      status: "PENDING",
      level: draft.level,
      provider: ai.name,
    },
  });

  let order = 0;
  for (const item of draft.items) {
    const skill = await upsertSkill(
      item.skill,
      context.skills.find((s) => s.name === item.skill)?.category ?? "OUTRO"
    );
    await prisma.assessmentItem.create({
      data: {
        assessmentId: assessment.id,
        skillId: skill.id,
        type: item.type,
        prompt: item.prompt,
        options: item.options ? JSON.stringify(item.options) : null,
        correctIndex: item.correctIndex ?? null,
        rubric: item.rubric ?? null,
        starterCode: item.starterCode ?? null,
        language: item.language ?? null,
        testCases: item.testCases ? JSON.stringify(item.testCases) : null,
        order: order++,
      },
    });
  }

  await audit(
    session.user.id,
    "ASSESSMENT_GENERATED",
    "Assessment",
    assessment.id,
    `${draft.items.length} itens de ${chosen.name} via ${ai.name}`
  );

  return NextResponse.json({ ok: true, assessmentId: assessment.id });
}
