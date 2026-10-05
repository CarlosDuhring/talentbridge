import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { confirmResumeSkills } from "@/lib/resume-service";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  code: z.string().regex(/^\d{6}$/, "Informe o código de 6 dígitos"),
  skills: z
    .array(
      z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        evidence: z.string().optional(),
      })
    )
    .max(50)
    .optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }
  const { email, code, skills } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { candidate: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({
      ok: true,
      redirect: user.role === "CANDIDATE" ? "/candidato" : "/empresa",
    });
  }
  if (!user.verificationCode || user.verificationCode !== code) {
    return NextResponse.json({ error: "Código incorreto." }, { status: 400 });
  }
  if (!user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
    return NextResponse.json(
      { error: "Código expirado. Solicite um novo código." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationCode: null,
      verificationExpiresAt: null,
    },
  });

  if (user.candidate && skills && skills.length > 0) {
    await confirmResumeSkills(user.candidate.id, skills);
    await audit(
      user.id,
      "SKILLS_CONFIRMED",
      "CandidateProfile",
      user.candidate.id,
      `${skills.length} competência(s) confirmada(s) no cadastro`
    );
  }

  await createSession(user.id);
  await audit(user.id, "EMAIL_VERIFIED", "User", user.id);

  return NextResponse.json({
    ok: true,
    redirect: user.role === "CANDIDATE" ? "/candidato/boas-vindas" : "/empresa",
  });
}
