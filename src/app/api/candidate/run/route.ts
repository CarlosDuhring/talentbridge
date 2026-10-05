import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCandidate } from "@/lib/auth";
import { runCode } from "@/lib/runner";

export const maxDuration = 30;

const schema = z.object({
  language: z.enum(["php", "javascript", "python", "java"]),
  code: z.string().max(50000),
  stdin: z.string().max(10000).optional(),
});

export async function POST(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const result = await runCode(
    parsed.data.language,
    parsed.data.code,
    parsed.data.stdin ?? ""
  );
  return NextResponse.json(result);
}
