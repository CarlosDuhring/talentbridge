import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { upsertSkill } from "@/lib/scoring";
import { refreshJobCandidates } from "@/lib/eligibility";
import { audit } from "@/lib/audit";

const schema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(20).optional(),
  level: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCompany();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const job = await prisma.job.findFirst({
    where: { id, companyId: session.profile.id },
  });
  if (!job) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { requirements, ...jobData } = parsed.data;
  await prisma.job.update({ where: { id }, data: jobData });

  if (requirements) {
    await prisma.jobRequirement.deleteMany({ where: { jobId: id } });
    for (const r of requirements) {
      const skill = await upsertSkill(r.skill, "OUTRO");
      await prisma.jobRequirement.create({
        data: {
          jobId: id,
          skillId: skill.id,
          kind: r.kind,
          minScore: r.minScore,
        },
      });
    }
  }

  await refreshJobCandidates(id);
  await audit(session.user.id, "JOB_UPDATED", "Job", id);
  return NextResponse.json({ ok: true });
}
