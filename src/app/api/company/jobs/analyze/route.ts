import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCompany } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai";

export const maxDuration = 60;

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(20),
});

export async function POST(req: Request) {
  const session = await requireCompany();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const ai = getAIProvider();
  const analysis = await ai.analyzeJob(parsed.data.description, parsed.data.title);
  return NextResponse.json({ ok: true, analysis });
}
