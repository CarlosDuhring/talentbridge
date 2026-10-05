import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCompany();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const resume = await prisma.resume.findFirst({
    where: {
      id,
      candidate: {
        jobCandidates: { some: { job: { companyId: session.profile.id } } },
      },
    },
  });
  if (!resume || !resume.fileData) {
    return NextResponse.json(
      { error: "Currículo não encontrado." },
      { status: 404 }
    );
  }

  await audit(
    session.user.id,
    "RESUME_VIEWED",
    "Resume",
    resume.id,
    `Download por ${session.profile.tradeName}`
  );

  const buffer = Buffer.from(resume.fileData, "base64");
  const safeName = resume.fileName.replace(/[^\w.\-]+/g, "_");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": resume.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
