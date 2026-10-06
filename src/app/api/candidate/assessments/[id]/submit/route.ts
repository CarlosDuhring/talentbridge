import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai";
import { runTestCases, type TestCase } from "@/lib/runner";
import { recomputeSkillScores } from "@/lib/scoring";
import { refreshCandidateAcrossJobs } from "@/lib/eligibility";
import { generateCourseRecommendations } from "@/lib/courses";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

const schema = z.object({
  answers: z.array(
    z.object({
      itemId: z.string(),
      answer: z.string(),
    })
  ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const assessment = await prisma.assessment.findFirst({
    where: { id, candidateId: session.profile.id },
    include: { items: { include: { skill: true } } },
  });
  if (!assessment) {
    return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
  }
  if (assessment.status === "COMPLETED") {
    return NextResponse.json({ error: "Avaliação já concluída" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Respostas inválidas" }, { status: 400 });
  }

  const ai = getAIProvider();
  const answerMap = new Map(parsed.data.answers.map((a) => [a.itemId, a.answer]));

  for (const item of assessment.items) {
    const answer = answerMap.get(item.id) ?? "";
    let score = 0;
    let feedback = "";
    let breakdown = "";

    try {
      if (item.type === "MULTIPLE_CHOICE") {
        const chosen = parseInt(answer, 10);
        const correct = chosen === item.correctIndex;
        score = correct ? 100 : 0;
        feedback = correct
          ? "Resposta correta."
          : `Resposta incorreta. Alternativa correta: ${String.fromCharCode(65 + (item.correctIndex ?? 0))}.`;
        breakdown = "Correção automática";
      } else if (item.type === "OPEN") {
        const result = await ai.gradeOpenAnswer(
          item.prompt,
          item.rubric ?? "",
          answer
        );
        score = result.score;
        feedback = result.feedback;
        breakdown = result.breakdown ?? "";
      } else if (item.type === "CODE") {
        const cases: TestCase[] = item.testCases ? JSON.parse(item.testCases) : [];
        const summary = await runTestCases(item.language ?? "javascript", answer, cases);
        const result = await ai.analyzeCode(
          item.prompt,
          item.language ?? "javascript",
          answer,
          {
            passed: summary.passed,
            total: summary.total,
            failures: summary.failures,
          }
        );
        score = result.score;
        feedback = result.feedback;
        breakdown = `${result.breakdown ?? ""} · Casos: ${summary.results
          .map((r) => (r.passed ? "✓" : "✗"))
          .join(" ")}`;
      }
    } catch {
      score = 0;
      feedback =
        "Não foi possível corrigir automaticamente este item. A avaliação foi concluída e o item conta como não pontuado.";
      breakdown = "Falha na correção automática";
    }

    await prisma.assessmentResponse.upsert({
      where: { itemId: item.id },
      update: { answer, score, feedback, breakdown },
      create: { itemId: item.id, answer, score, feedback, breakdown },
    });
  }

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  await recomputeSkillScores(session.profile.id);
  await refreshCandidateAcrossJobs(session.profile.id);
  try {
    await generateCourseRecommendations(session.profile.id);
  } catch {
    /* recomendações são complementares; a conclusão da avaliação não depende delas */
  }
  await audit(
    session.user.id,
    "ASSESSMENT_COMPLETED",
    "Assessment",
    assessment.id
  );

  return NextResponse.json({ ok: true, redirect: `/candidato/avaliacoes/${assessment.id}/resultado` });
}
