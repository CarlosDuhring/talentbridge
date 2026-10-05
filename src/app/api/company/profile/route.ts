import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/auth";

const schema = z.object({
  tradeName: z.string().min(2).optional(),
  sector: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await requireCompany();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  await prisma.companyProfile.update({
    where: { id: session.profile.id },
    data: parsed.data,
  });
  return NextResponse.json({ ok: true });
}
