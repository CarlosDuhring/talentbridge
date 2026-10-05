import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";

const CODE_TTL_MINUTES = 15;

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Este e-mail já foi verificado." }, { status: 400 });
  }

  const code = String(randomInt(100000, 1000000));
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationCode: code,
      verificationExpiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, devCode: code });
}
