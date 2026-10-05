import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      {
        error: "Confirme seu e-mail para entrar. Enviamos um código de verificação.",
        code: "EMAIL_NOT_VERIFIED",
        email: user.email,
      },
      { status: 403 }
    );
  }

  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    redirect: user.role === "CANDIDATE" ? "/candidato" : "/empresa",
  });
}
