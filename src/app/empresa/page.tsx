import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CompanyDashboard() {
  const session = await requireCompany();
  if (!session) return null;
  const companyId = session.profile.id;

  const jobs = await prisma.job.findMany({
    where: { companyId },
    include: {
      candidates: true,
      requirements: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const candidateIds = [...new Set(jobs.flatMap((j) => j.candidates.map((c) => c.candidateId)))];
  const assessmentsCount = await prisma.assessment.count({
    where: { candidateId: { in: candidateIds }, status: "COMPLETED" },
  });

  const openJobs = jobs.filter((j) => j.status === "OPEN");
  const totalEligible = jobs.reduce(
    (acc, j) => acc + j.candidates.filter((c) => c.eligible).length,
    0
  );
  const inProcess = jobs.reduce(
    (acc, j) =>
      acc +
      j.candidates.filter((c) =>
        ["IN_REVIEW", "INTERVIEW", "SELECTED"].includes(c.stage)
      ).length,
    0
  );
  const hired = jobs.reduce(
    (acc, j) => acc + j.candidates.filter((c) => c.stage === "HIRED").length,
    0
  );

  return (
    <div>
      <PageHeader
        title={`Painel — ${session.profile.tradeName}`}
        subtitle="Acompanhe suas vagas, candidatos elegíveis e etapas do processo seletivo."
        action={<ButtonLink href="/empresa/vagas/nova">Nova vaga</ButtonLink>}
      />

      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: "Vagas abertas", value: openJobs.length },
          { label: "Candidatos elegíveis", value: totalEligible },
          { label: "Avaliações concluídas", value: assessmentsCount },
          { label: "Em processo", value: inProcess },
          { label: "Contratados", value: hired },
        ].map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-sm text-graphite">{s.label}</p>
              <p className="mt-1 text-[32px] font-semibold tabular-nums leading-none">
                {s.value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Suas vagas"
          subtitle={`${jobs.length} vaga(s) no total`}
          action={
            <ButtonLink href="/empresa/vagas" variant="text" size="sm">
              Ver todas
            </ButtonLink>
          }
        />
        <CardBody>
          {jobs.length === 0 ? (
            <EmptyState
              title="Nenhuma vaga publicada"
              description="Crie sua primeira vaga. A IA extrai os critérios técnicos e identifica candidatos elegíveis automaticamente."
              action={
                <ButtonLink href="/empresa/vagas/nova" variant="ghost">
                  Criar vaga
                </ButtonLink>
              }
            />
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((j) => {
                const eligible = j.candidates.filter((c) => c.eligible).length;
                return (
                  <div
                    key={j.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/[0.06] px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{j.title}</p>
                      <p className="text-xs text-stone">
                        {j.requirements.length} critérios · nível {j.level}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={j.status === "OPEN" ? "green" : "neutral"}>
                        {j.status === "OPEN" ? "Aberta" : "Fechada"}
                      </Badge>
                      <Badge tone="blue">{eligible} elegíveis</Badge>
                      <ButtonLink
                        href={`/empresa/vagas/${j.id}`}
                        variant="outlined"
                        size="sm"
                      >
                        Abrir
                      </ButtonLink>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
