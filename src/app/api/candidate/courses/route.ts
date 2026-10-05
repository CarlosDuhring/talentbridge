import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai";
import { buildCandidateContext, getOverallScore } from "@/lib/scoring";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

export async function POST() {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const context = await buildCandidateContext(session.profile.id);
  if (!context) return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });

  const skillScores = await prisma.skillScore.findMany({
    where: { candidateId: session.profile.id },
    include: { skill: true },
  });
  const scores: { skill: string; score: number | null }[] = skillScores.map(
    (s) => ({ skill: s.skill.name, score: s.score })
  );

  const informed = context.skills
    .filter((s) => s.source === "INFORMED")
    .map((s) => s.name);
  for (const name of informed) {
    if (!scores.some((s) => s.skill === name)) {
      scores.push({ skill: name, score: null });
    }
  }

  const ai = getAIProvider();
  const suggestions = await ai.recommendCourses(context, scores);

  await prisma.courseRecommendation.deleteMany({
    where: { candidateId: session.profile.id },
  });

  for (const s of suggestions) {
    const skill = await prisma.skill.findUnique({ where: { name: s.skill } });
    if (!skill) continue;
    let course = await prisma.course.findFirst({
      where: { skillId: skill.id, title: s.title },
    });
    if (!course) {
      course = await prisma.course.create({
        data: {
          title: s.title,
          provider: s.provider,
          level: s.level,
          hours: s.hours,
          url: s.url,
          skillId: skill.id,
        },
      });
    }
    await prisma.courseRecommendation.create({
      data: {
        candidateId: session.profile.id,
        courseId: course.id,
        reason: s.reason,
        priority: s.priority,
      },
    });
  }

  await audit(
    session.user.id,
    "COURSES_RECOMMENDED",
    "CandidateProfile",
    session.profile.id,
    `${suggestions.length} recomendações via ${ai.name}`
  );

  return NextResponse.json({ ok: true, count: suggestions.length });
}
