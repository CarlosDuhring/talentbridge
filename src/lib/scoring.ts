import { prisma } from "./db";
import { inferLevel, monthsBetween } from "./ai/mock";
import type { CandidateContext } from "./ai/types";

export async function buildCandidateContext(
  candidateId: string
): Promise<CandidateContext | null> {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { id: candidateId },
    include: {
      user: true,
      skills: { include: { skill: true } },
      experiences: true,
      projects: true,
      educations: true,
    },
  });
  if (!candidate) return null;

  const experiences = candidate.experiences.map((e) => ({
    role: e.role,
    company: e.company,
    technologies: e.technologies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    months: monthsBetween(e.startDate, e.current ? null : e.endDate),
  }));

  const totalMonths = experiences.reduce((acc, e) => acc + e.months, 0);
  const level = inferLevel(totalMonths);

  const skillMap = new Map<
    string,
    { name: string; category: string; source: string; evidence?: string | null }
  >();
  for (const s of candidate.skills) {
    const existing = skillMap.get(s.skill.name);
    if (!existing || (existing.source === "INFORMED" && s.source === "ASSESSED")) {
      skillMap.set(s.skill.name, {
        name: s.skill.name,
        category: s.skill.category,
        source: s.source,
        evidence: s.evidence,
      });
    }
  }

  return {
    candidateId,
    name: candidate.user.name,
    headline: candidate.headline,
    objective: candidate.objective,
    level,
    skills: [...skillMap.values()],
    experiences,
    projects: candidate.projects.map((p) => ({
      name: p.name,
      technologies: p.technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    })),
    education: candidate.educations.map((e) => ({
      course: e.course,
      level: e.level,
    })),
  };
}

export async function upsertSkill(name: string, category: string) {
  return prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name, category },
  });
}

export async function addCandidateSkill(
  candidateId: string,
  skillId: string,
  source: "INFORMED" | "ASSESSED",
  evidence?: string
) {
  return prisma.candidateSkill.upsert({
    where: {
      candidateId_skillId_source: { candidateId, skillId, source },
    },
    update: { evidence: evidence ?? undefined },
    create: { candidateId, skillId, source, evidence },
  });
}

export async function recomputeSkillScores(candidateId: string) {
  const responses = await prisma.assessmentResponse.findMany({
    where: {
      item: {
        assessment: { candidateId, status: "COMPLETED" },
      },
    },
    include: { item: { include: { skill: true } } },
  });

  const bySkill = new Map<
    string,
    { skillId: string; skillName: string; scores: number[]; items: string[] }
  >();

  for (const r of responses) {
    const key = r.item.skillId;
    if (!bySkill.has(key)) {
      bySkill.set(key, {
        skillId: key,
        skillName: r.item.skill.name,
        scores: [],
        items: [],
      });
    }
    const entry = bySkill.get(key)!;
    entry.scores.push(r.score);
    entry.items.push(
      `${r.item.type === "MULTIPLE_CHOICE" ? "Múltipla escolha" : r.item.type === "OPEN" ? "Aberta" : "Código"}: ${Math.round(r.score)}/100`
    );
  }

  for (const entry of bySkill.values()) {
    const avg =
      entry.scores.reduce((a, b) => a + b, 0) / Math.max(entry.scores.length, 1);
    await prisma.skillScore.upsert({
      where: {
        candidateId_skillId: { candidateId, skillId: entry.skillId },
      },
      update: {
        score: avg,
        source: "ASSESSED",
        breakdown: entry.items.join(" · "),
      },
      create: {
        candidateId,
        skillId: entry.skillId,
        score: avg,
        source: "ASSESSED",
        breakdown: entry.items.join(" · "),
      },
    });
    await addCandidateSkill(candidateId, entry.skillId, "ASSESSED");
  }

  return bySkill.size;
}

export async function getOverallScore(candidateId: string): Promise<number | null> {
  const scores = await prisma.skillScore.findMany({ where: { candidateId } });
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, s) => a + s.score, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

export async function getCandidateReport(candidateId: string) {
  const candidate = await prisma.candidateProfile.findUnique({
    where: { id: candidateId },
    include: {
      user: true,
      skills: { include: { skill: true } },
      skillScores: { include: { skill: true } },
      experiences: true,
      projects: true,
      educations: true,
      certifications: true,
      coursesTaken: true,
      recommendations: { include: { course: { include: { skill: true } } } },
      assessments: {
        include: {
          items: { include: { response: true, skill: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!candidate) return null;

  const overall = await getOverallScore(candidateId);
  const assessed = candidate.skillScores
    .map((s) => ({ name: s.skill.name, score: s.score, breakdown: s.breakdown }))
    .sort((a, b) => b.score - a.score);

  const strengths = assessed.filter((s) => s.score >= 80).map((s) => s.name);
  const gaps = assessed.filter((s) => s.score < 70).map((s) => s.name);

  const informed = candidate.skills
    .filter((s) => s.source === "INFORMED")
    .map((s) => ({ name: s.skill.name, category: s.skill.category, evidence: s.evidence }));

  const notAssessed = informed
    .filter((i) => !assessed.some((a) => a.name === i.name))
    .map((i) => i.name);

  return {
    candidate,
    overall,
    assessed,
    strengths,
    gaps,
    informed,
    notAssessed,
  };
}
