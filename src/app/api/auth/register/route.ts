import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { validateStrongPassword } from "@/lib/password";
import { MAX_RESUME_SIZE, processResume } from "@/lib/resume-service";

export const maxDuration = 60;

const CODE_TTL_MINUTES = 15;

const schema = z.object({
  name: z.string().min(2, "Informe seu nome completo"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe uma senha"),
  passwordConfirm: z.string().optional(),
  role: z.enum(["CANDIDATE", "COMPANY"]),
  companyName: z.string().optional(),
  phone: z.string().optional(),
});

function generateCode() {
  return String(randomInt(100000, 1000000));
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let raw: Record<string, unknown> = {};
  let resumeFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        raw[key] = value;
      } else if (key === "resume" && value.size > 0) {
        resumeFile = value;
      }
    }
  } else {
    raw = (await req.json().catch(() => null)) ?? {};
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }
  const { name, email, password, role, companyName, phone } = parsed.data;

  if (parsed.data.passwordConfirm !== undefined && parsed.data.passwordConfirm !== password) {
    return NextResponse.json(
      { error: "As senhas não coincidem." },
      { status: 400 }
    );
  }

  const passwordError = validateStrongPassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  if (role === "CANDIDATE" && !resumeFile) {
    return NextResponse.json(
      { error: "Anexe seu currículo (PDF ou DOCX) para criar a conta." },
      { status: 400 }
    );
  }
  if (resumeFile && resumeFile.size > MAX_RESUME_SIZE) {
    return NextResponse.json(
      { error: "Currículo muito grande (máx. 8 MB)." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { candidate: true },
  });

  const code = generateCode();
  const verificationExpiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  if (existing) {
    if (existing.emailVerified) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 409 }
      );
    }
    if (!(await verifyPassword(password, existing.passwordHash))) {
      return NextResponse.json(
        {
          error:
            "Já existe um cadastro com este e-mail aguardando verificação. Use a mesma senha para continuar.",
        },
        { status: 409 }
      );
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { verificationCode: code, verificationExpiresAt },
    });

    let resumeAnalysis = null;
    if (role === "CANDIDATE" && resumeFile && existing.candidate) {
      try {
        const buffer = Buffer.from(await resumeFile.arrayBuffer());
        const result = await processResume(
          existing.candidate.id,
          buffer,
          resumeFile.name
        );
        resumeAnalysis = result.analysis;
        await audit(
          existing.id,
          "RESUME_UPLOAD",
          "Resume",
          result.resumeId,
          `Análise via ${result.provider} (retomada de cadastro)`
        );
      } catch (err) {
        return NextResponse.json(
          {
            error:
              err instanceof Error
                ? err.message
                : "Falha ao analisar o currículo. Tente novamente.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      email,
      role: existing.role,
      devCode: code,
      resumeAnalysis,
      resumed: true,
    });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      emailVerified: false,
      verificationCode: code,
      verificationExpiresAt,
      ...(role === "CANDIDATE"
        ? {
            candidate: {
              create: {
                phone: phone?.trim() || null,
              },
            },
          }
        : {
            company: {
              create: { tradeName: companyName?.trim() || name },
            },
          }),
    },
    include: { candidate: true },
  });

  let resumeAnalysis = null;
  if (role === "CANDIDATE" && resumeFile && user.candidate) {
    try {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const result = await processResume(user.candidate.id, buffer, resumeFile.name);
      resumeAnalysis = result.analysis;
      await audit(
        user.id,
        "RESUME_UPLOAD",
        "Resume",
        result.resumeId,
        `Análise via ${result.provider} (cadastro)`
      );
    } catch (err) {
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Falha ao analisar o currículo. Tente novamente.",
        },
        { status: 400 }
      );
    }
  }

  await audit(user.id, "REGISTER", "User", user.id, `Perfil ${role}`);

  return NextResponse.json({
    ok: true,
    email,
    role,
    devCode: code,
    resumeAnalysis,
  });
}
