import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { detectSkills } from "@/lib/ai/skills";
import { addCandidateSkill, upsertSkill } from "@/lib/scoring";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  technologies: z.string().optional(),
  url: z.string().optional(),
  repo: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      candidateId: session.profile.id,
      name: parsed.data.name,
      description: parsed.data.description,
      technologies: parsed.data.technologies ?? "",
      url: parsed.data.url || null,
      repo: parsed.data.repo || null,
    },
  });

  const techs = detectSkills(parsed.data.technologies ?? "");
  for (const t of techs) {
    const skill = await upsertSkill(t.name, t.category);
    await addCandidateSkill(
      session.profile.id,
      skill.id,
      "INFORMED",
      `Projeto: ${parsed.data.name}`,
      "PROJETO"
    );
  }

  return NextResponse.json({ ok: true, id: project.id });
}

export async function DELETE(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 });

  await prisma.project.deleteMany({
    where: { id, candidateId: session.profile.id },
  });
  return NextResponse.json({ ok: true });
}
