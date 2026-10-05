import { NextResponse } from "next/server";
import { requireCandidate } from "@/lib/auth";
import { MAX_RESUME_SIZE, processResume } from "@/lib/resume-service";
import { audit } from "@/lib/audit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await requireCandidate();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo PDF ou DOCX." }, { status: 400 });
  }
  if (file.size > MAX_RESUME_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 8 MB)." }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processResume(session.profile.id, buffer, file.name);

    await audit(
      session.user.id,
      "RESUME_UPLOAD",
      "Resume",
      result.resumeId,
      `Análise via ${result.provider}`
    );

    return NextResponse.json({
      ok: true,
      resumeId: result.resumeId,
      analysis: result.analysis,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Falha ao analisar o currículo.",
      },
      { status: 400 }
    );
  }
}
