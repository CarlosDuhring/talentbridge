import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai";
import { generateCourseRecommendations } from "@/lib/courses";
import { audit } from "@/lib/audit";

export const maxDuration = 120;

export async function POST() {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const count = await generateCourseRecommendations(session.profile.id);

  const ai = getAIProvider();
  await audit(
    session.user.id,
    "COURSES_RECOMMENDED",
    "CandidateProfile",
    session.profile.id,
    `${count} recomendações via ${ai.name}`
  );

  return NextResponse.json({ ok: true, count });
}