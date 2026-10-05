import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai";
import { buildCandidateContext, upsertSkill } from "@/lib/scoring";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

export async function POST() {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

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

  const ai = getAIProvider();
  const draft = await ai.generateAssessment(context);

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
    `${draft.items.length} itens via ${ai.name}`
  );

  return NextResponse.json({ ok: true, assessmentId: assessment.id });
}
