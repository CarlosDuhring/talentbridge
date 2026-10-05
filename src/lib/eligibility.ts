import { prisma } from "./db";
import { getOverallScore } from "./scoring";
import { monthsBetween } from "./ai/mock";

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
  checks: {
    label: string;
    required: string;
    actual: string;
    passed: boolean;
  }[];
};

export async function evaluateEligibility(
  jobId: string,
  candidateId: string
): Promise<EligibilityResult> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { requirements: { include: { skill: true } } },
  });
  if (!job) {
    return { eligible: false, reasons: ["Vaga não encontrada"], checks: [] };
  }

  const scores = await prisma.skillScore.findMany({
    where: { candidateId },
    include: { skill: true },
  });
  const scoreMap = new Map(scores.map((s) => [s.skill.name, s.score]));

  const experiences = await prisma.experience.findMany({ where: { candidateId } });
  const totalMonths = experiences.reduce(
    (acc, e) => acc + monthsBetween(e.startDate, e.current ? null : e.endDate),
    0
  );
  const totalYears = Math.round((totalMonths / 12) * 10) / 10;

  const overall = await getOverallScore(candidateId);
  const checks: EligibilityResult["checks"] = [];
  const reasons: string[] = [];

  for (const req of job.requirements) {
    const score = scoreMap.get(req.skill.name);
    const passed = score !== undefined && score >= req.minScore;
    checks.push({
      label: `${req.skill.name} (${req.kind === "MANDATORY" ? "obrigatória" : "desejável"})`,
      required: `≥ ${req.minScore}`,
      actual: score !== undefined ? `${Math.round(score)}` : "não avaliado",
      passed,
    });
    if (!passed && req.kind === "MANDATORY") {
      reasons.push(
        score === undefined
          ? `${req.skill.name}: competência obrigatória ainda não avaliada`
          : `${req.skill.name}: ${Math.round(score)}/100 (mínimo ${req.minScore})`
      );
    }
  }

  const overallPassed = overall !== null && overall >= job.minOverallScore;
  checks.push({
    label: "Pontuação geral",
    required: `≥ ${job.minOverallScore}`,
    actual: overall !== null ? `${Math.round(overall)}` : "sem avaliações",
    passed: overallPassed,
  });
  if (!overallPassed) {
    reasons.push(
      overall === null
        ? "Nenhuma avaliação concluída"
        : `Pontuação geral ${Math.round(overall)}/100 (mínimo ${job.minOverallScore})`
    );
  }

  const expPassed = totalYears >= job.minExperienceYears;
  checks.push({
    label: "Experiência mínima",
    required: `≥ ${job.minExperienceYears} ano(s)`,
    actual: `${totalYears} ano(s)`,
    passed: expPassed,
  });
  if (!expPassed) {
    reasons.push(
      `Experiência ${totalYears} ano(s) (mínimo ${job.minExperienceYears})`
    );
  }

  return { eligible: reasons.length === 0, reasons, checks };
}

function nextStage(current: string | null | undefined, eligible: boolean): string {
  const fallback = eligible ? "ELIGIBLE" : "INELIGIBLE";
  if (!current) return fallback;
  if (current === "ELIGIBLE" && !eligible) return "INELIGIBLE";
  if (current === "INELIGIBLE" && eligible) return "ELIGIBLE";
  return current;
}

export async function refreshJobCandidates(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  const candidates = await prisma.candidateProfile.findMany({
    select: { id: true },
  });

  for (const c of candidates) {
    const result = await evaluateEligibility(jobId, c.id);
    const existing = await prisma.jobCandidate.findUnique({
      where: { jobId_candidateId: { jobId, candidateId: c.id } },
      select: { stage: true },
    });
    await prisma.jobCandidate.upsert({
      where: { jobId_candidateId: { jobId, candidateId: c.id } },
      update: {
        eligible: result.eligible,
        reasons: result.reasons.length ? JSON.stringify(result.reasons) : null,
        stage: nextStage(existing?.stage, result.eligible),
      },
      create: {
        jobId,
        candidateId: c.id,
        eligible: result.eligible,
        reasons: result.reasons.length ? JSON.stringify(result.reasons) : null,
        stage: result.eligible ? "ELIGIBLE" : "INELIGIBLE",
      },
    });
  }
}

export async function refreshCandidateAcrossJobs(candidateId: string) {
  const jobs = await prisma.job.findMany({ select: { id: true } });
  for (const job of jobs) {
    const result = await evaluateEligibility(job.id, candidateId);
    const existing = await prisma.jobCandidate.findUnique({
      where: { jobId_candidateId: { jobId: job.id, candidateId } },
      select: { stage: true },
    });
    await prisma.jobCandidate.upsert({
      where: { jobId_candidateId: { jobId: job.id, candidateId } },
      update: {
        eligible: result.eligible,
        reasons: result.reasons.length ? JSON.stringify(result.reasons) : null,
        stage: nextStage(existing?.stage, result.eligible),
      },
      create: {
        jobId: job.id,
        candidateId,
        eligible: result.eligible,
        reasons: result.reasons.length ? JSON.stringify(result.reasons) : null,
        stage: result.eligible ? "ELIGIBLE" : "INELIGIBLE",
      },
    });
  }
}
