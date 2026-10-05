import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";

const schema = z.object({
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  objective: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  linkedin: z.string().optional(),
  workCardNotes: z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await prisma.candidateProfile.update({
    where: { id: session.profile.id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
