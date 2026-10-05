import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai";
import { upsertSkill } from "@/lib/scoring";
import { refreshJobCandidates } from "@/lib/eligibility";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(20),
  level: z.string().optional(),
  location: z.string().optional(),
  minExperienceYears: z.number().int().min(0).max(30).optional(),
  minOverallScore: z.number().int().min(0).max(100).optional(),
  requirements: z
    .array(
      z.object({
        skill: z.string().min(1),
        kind: z.enum(["MANDATORY", "DESIRABLE"]),
        minScore: z.number().int().min(0).max(100),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const session = await requireCompany();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const ai = getAIProvider();
  const analysis = await ai.analyzeJob(parsed.data.description, parsed.data.title);

  const requirements =
    parsed.data.requirements && parsed.data.requirements.length > 0
      ? parsed.data.requirements
      : [
          ...analysis.mandatory.map((m) => ({
            skill: m.skill,
            kind: "MANDATORY" as const,
            minScore: m.minScore,
          })),
          ...analysis.desirable.map((d) => ({
            skill: d.skill,
            kind: "DESIRABLE" as const,
            minScore: d.minScore,
          })),
        ];

  const job = await prisma.job.create({
    data: {
      companyId: session.profile.id,
      title: parsed.data.title,
      description: parsed.data.description,
      level: parsed.data.level ?? analysis.level,
      location: parsed.data.location,
      minExperienceYears:
        parsed.data.minExperienceYears ?? analysis.minExperienceYears,
      minOverallScore: parsed.data.minOverallScore ?? analysis.minOverallScore,
    },
  });

  await prisma.jobAnalysis.create({
    data: {
      jobId: job.id,
      provider: ai.name,
      data: JSON.stringify(analysis),
    },
  });

  for (const r of requirements) {
    const skill = await upsertSkill(r.skill, "OUTRO");
    await prisma.jobRequirement.create({
      data: {
        jobId: job.id,
        skillId: skill.id,
        kind: r.kind,
        minScore: r.minScore,
      },
    });
  }

  await refreshJobCandidates(job.id);
  await audit(
    session.user.id,
    "JOB_CREATED",
    "Job",
    job.id,
    `Análise via ${ai.name}`
  );

  return NextResponse.json({ ok: true, jobId: job.id });
}
