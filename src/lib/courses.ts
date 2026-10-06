import { prisma } from "./db";
import { getAIProvider } from "./ai";
import { buildCandidateContext, upsertSkill } from "./scoring";
import { safeExternalUrl } from "./url";

function searchFallback(skill: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `curso ${skill}`
  )}`;
}

export async function generateCourseRecommendations(candidateId: string) {
  const context = await buildCandidateContext(candidateId);
  if (!context) return 0;

  const skillScores = await prisma.skillScore.findMany({
    where: { candidateId },
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

  await prisma.courseRecommendation.deleteMany({ where: { candidateId } });

  let count = 0;
  for (const s of suggestions) {
    const skill =
      (await prisma.skill.findUnique({ where: { name: s.skill } })) ??
      (await upsertSkill(s.skill, "OUTRO"));

    const url = safeExternalUrl(s.url) ?? searchFallback(s.skill);
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
          url,
          skillId: skill.id,
        },
      });
    } else if (course.url !== url) {
      course = await prisma.course.update({
        where: { id: course.id },
        data: { url },
      });
    }

    await prisma.courseRecommendation.create({
      data: {
        candidateId,
        courseId: course.id,
        reason: s.reason,
        priority: s.priority,
      },
    });
    count++;
  }

  return count;
}