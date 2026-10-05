import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { detectSkills } from "@/lib/ai/skills";
import { addCandidateSkill, upsertSkill } from "@/lib/scoring";
import { refreshCandidateAcrossJobs } from "@/lib/eligibility";

const schema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
  technologies: z.string().optional(),
  registered: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const exp = await prisma.experience.create({
    data: {
      candidateId: session.profile.id,
      company: parsed.data.company,
      role: parsed.data.role,
      startDate: parsed.data.startDate,
      endDate: parsed.data.current ? null : parsed.data.endDate || null,
      current: parsed.data.current ?? false,
      description: parsed.data.description,
      technologies: parsed.data.technologies ?? "",
      registered: parsed.data.registered ?? false,
    },
  });

  const techs = detectSkills(parsed.data.technologies ?? "");
  for (const t of techs) {
    const skill = await upsertSkill(t.name, t.category);
    await addCandidateSkill(
      session.profile.id,
      skill.id,
      "INFORMED",
      `Experiência: ${parsed.data.role} na ${parsed.data.company}`
    );
  }

  await refreshCandidateAcrossJobs(session.profile.id);
  return NextResponse.json({ ok: true, id: exp.id });
}

export async function DELETE(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 });

  await prisma.experience.deleteMany({
    where: { id, candidateId: session.profile.id },
  });
  await refreshCandidateAcrossJobs(session.profile.id);
  return NextResponse.json({ ok: true });
}
