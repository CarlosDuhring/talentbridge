import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ResumeUpload } from "@/components/forms/ResumeUpload";

export default async function ResumePage() {
  const session = await requireCandidate();
  if (!session) return null;

  const resumes = await prisma.resume.findMany({
    where: { candidateId: session.profile.id },
    include: { analysis: true },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Currículo"
        subtitle="Envie seu currículo para extração automática de competências, experiências e formação."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ResumeUpload />
        </div>

        <Card>
          <CardHeader title="Histórico de envios" />
          <CardBody className="space-y-3">
            {resumes.length === 0 ? (
              <p className="text-sm text-graphite">
                Nenhum currículo enviado ainda.
              </p>
            ) : (
              resumes.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-black/[0.06] px-3 py-2.5"
                >
                  <p className="truncate text-sm font-medium">{r.fileName}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-stone">
                      {new Date(r.uploadedAt).toLocaleDateString("pt-BR")}
                    </span>
                    {r.analysis ? (
                      <Badge tone="green">Analisado</Badge>
                    ) : (
                      <Badge tone="yellow">Pendente</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
