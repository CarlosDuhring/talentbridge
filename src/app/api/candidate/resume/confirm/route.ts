import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCandidate } from "@/lib/auth";
import { confirmResumeSkills } from "@/lib/resume-service";
import { audit } from "@/lib/audit";

const schema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string().min(1),
        category: z.string().min(1),
        evidence: z.string().optional(),
      })
    )
    .max(50),
});

export async function POST(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const count = await confirmResumeSkills(session.profile.id, parsed.data.skills);
  await audit(
    session.user.id,
    "SKILLS_CONFIRMED",
    "CandidateProfile",
    session.profile.id,
    `${count} competência(s) confirmada(s)`
  );

  return NextResponse.json({ ok: true, count });
}
