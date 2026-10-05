import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function JobsPage() {
  const session = await requireCompany();
  if (!session) return null;

  const jobs = await prisma.job.findMany({
    where: { companyId: session.profile.id },
    include: { candidates: true, requirements: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Vagas"
        subtitle="Todas as vagas da empresa e o número de candidatos elegíveis."
        action={<ButtonLink href="/empresa/vagas/nova">Nova vaga</ButtonLink>}
      />

      {jobs.length === 0 ? (
        <EmptyState
          title="Nenhuma vaga publicada"
          description="Crie sua primeira vaga para começar a receber candidatos elegíveis."
          action={
            <ButtonLink href="/empresa/vagas/nova" variant="ghost">
              Criar vaga
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => {
            const eligible = j.candidates.filter((c) => c.eligible).length;
            const inProcess = j.candidates.filter((c) =>
              ["IN_REVIEW", "INTERVIEW", "SELECTED"].includes(c.stage)
            ).length;
            return (
              <Card key={j.id}>
                <CardBody className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold">{j.title}</h3>
                    <p className="mt-0.5 text-sm text-graphite">
                      {j.location ? `${j.location} · ` : ""}nível {j.level} ·{" "}
                      {j.requirements.length} critérios
                    </p>
                    <p className="mt-0.5 text-xs text-stone">
                      Criada em {new Date(j.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={j.status === "OPEN" ? "green" : "neutral"}>
                      {j.status === "OPEN" ? "Aberta" : "Fechada"}
                    </Badge>
                    <Badge tone="blue">{eligible} elegíveis</Badge>
                    {inProcess > 0 ? (
                      <Badge tone="purple">{inProcess} em processo</Badge>
                    ) : null}
                    <ButtonLink
                      href={`/empresa/vagas/${j.id}`}
                      variant="outlined"
                      size="sm"
                    >
                      Abrir
                    </ButtonLink>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
