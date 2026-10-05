import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const ACTION_LABELS: Record<string, string> = {
  JOB_CREATED: "Vaga criada",
  JOB_UPDATED: "Vaga atualizada",
  CANDIDATE_STAGE_CHANGED: "Etapa alterada",
  ASSESSMENT_GENERATED: "Avaliação gerada",
  ASSESSMENT_COMPLETED: "Avaliação concluída",
  COURSES_RECOMMENDED: "Cursos recomendados",
  RESUME_UPLOAD: "Currículo enviado",
  REGISTER: "Cadastro",
};

export default async function CompanyAuditPage() {
  const session = await requireCompany();
  if (!session) return null;

  const jobs = await prisma.job.findMany({
    where: { companyId: session.profile.id },
    select: { id: true, title: true, candidates: { select: { id: true } } },
  });
  const jobIds = jobs.map((j) => j.id);
  const jobCandidateIds = jobs.flatMap((j) => j.candidates.map((c) => c.id));
  const jobTitleById = new Map(jobs.map((j) => [j.id, j.title]));

  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity: "Job", entityId: { in: jobIds } },
        { entity: "JobCandidate", entityId: { in: jobCandidateIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true },
  });
  const actorById = new Map(actors.map((a) => [a.id, a]));

  return (
    <div>
      <PageHeader
        title="Auditoria"
        subtitle="Histórico de ações registradas nas vagas e nos processos seletivos da sua empresa."
      />

      <Card>
        <CardHeader
          title="Registros recentes"
          subtitle={`${logs.length} evento(s) — retenção interna para rastreabilidade`}
        />
        <CardBody>
          {logs.length === 0 ? (
            <EmptyState
              title="Nenhum evento registrado"
              description="Ações como criação de vaga, mudança de etapa e conclusão de avaliações aparecem aqui."
            />
          ) : (
            <div className="divide-y divide-black/[0.06]">
              {logs.map((log) => {
                const actor = log.actorId ? actorById.get(log.actorId) : null;
                const jobTitle =
                  log.entity === "Job"
                    ? jobTitleById.get(log.entityId ?? "")
                    : undefined;
                return (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {ACTION_LABELS[log.action] ?? log.action}
                        {jobTitle ? (
                          <span className="font-normal text-graphite">
                            {" "}
                            — {jobTitle}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-stone">
                        {actor ? `${actor.name} · ` : ""}
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                        {log.detail ? ` · ${log.detail}` : ""}
                      </p>
                    </div>
                    <Badge tone="neutral">{log.entity}</Badge>
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
