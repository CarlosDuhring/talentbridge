import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { audit } from "@/lib/audit";

const STAGES = [
  "ELIGIBLE",
  "IN_REVIEW",
  "INTERVIEW",
  "SELECTED",
  "HIRED",
  "REJECTED",
] as const;

const schema = z.object({
  candidateId: z.string(),
  stage: z.enum(STAGES),
});

export async function POST(
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

  const jc = await prisma.jobCandidate.findUnique({
    where: {
      jobId_candidateId: { jobId: id, candidateId: parsed.data.candidateId },
    },
  });
  if (!jc) {
    return NextResponse.json({ error: "Candidato não vinculado à vaga" }, { status: 404 });
  }

  await prisma.jobCandidate.update({
    where: { id: jc.id },
    data: { stage: parsed.data.stage },
  });

  await audit(
    session.user.id,
    "CANDIDATE_STAGE_CHANGED",
    "JobCandidate",
    jc.id,
    `${jc.stage} → ${parsed.data.stage}`
  );

  return NextResponse.json({ ok: true });
}
