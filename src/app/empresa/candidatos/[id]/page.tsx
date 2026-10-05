import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCandidateReport } from "@/lib/scoring";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { ProgressBar, scoreBarTone } from "@/components/ui/ProgressBar";
import { DonutScore, RadarChart } from "@/components/charts/Charts";
import { ButtonLink } from "@/components/ui/Button";
import { originLabel } from "@/lib/origins";

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCompany();
  if (!session) return null;

  const { id } = await params;

  const link = await prisma.jobCandidate.findFirst({
    where: {
      candidateId: id,
      job: { companyId: session.profile.id },
    },
    include: { job: true },
  });
  if (!link) notFound();

  const report = await getCandidateReport(id);
  if (!report) notFound();

  const { candidate, overall, assessed, strengths, gaps, informed, notAssessed } =
    report;

  return (
    <div>
      <PageHeader
        title={candidate.user.name}
        subtitle={`${candidate.headline ?? "Candidato"}${
          candidate.location ? ` · ${candidate.location}` : ""
        }`}
        action={
          <ButtonLink href={`/empresa/vagas/${link.jobId}`} variant="outlined">
            Voltar para a vaga
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody className="flex flex-col items-center py-8">
            {overall !== null ? (
              <DonutScore value={overall} label="Geral" />
            ) : (
              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full border-4 border-dashed border-black/[0.08] text-center text-xs text-stone">
                Sem avaliações
              </div>
            )}
            <p className="mt-4 text-center text-sm text-graphite">
              {assessed.length} competência(s) comprovada(s) por avaliação.
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Mapa de competências comprovadas"
            subtitle="Somente resultados de avaliações — currículo não conta como prova."
          />
          <CardBody className="flex justify-center">
            {assessed.length > 0 ? (
              <RadarChart
                data={assessed.slice(0, 8).map((s) => ({
                  label: s.name,
                  value: s.score,
                }))}
              />
            ) : (
              <p className="py-8 text-sm text-graphite">
                Este candidato ainda não concluiu avaliações.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Competências comprovadas" />
          <CardBody className="space-y-4">
            {assessed.length === 0 ? (
              <p className="text-sm text-graphite">Nenhuma avaliação concluída.</p>
            ) : (
              assessed.map((s) => (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{s.name}</span>
                    <ScoreBadge score={s.score} />
                  </div>
                  <ProgressBar value={s.score} tone={scoreBarTone(s.score)} />
                  {s.breakdown ? (
                    <p className="mt-1 text-xs text-stone">{s.breakdown}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Resumo profissional" />
            <CardBody className="space-y-3 text-sm">
              {candidate.objective ? (
                <p className="text-graphite">{candidate.objective}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {candidate.github ? (
                  <a
                    href={`https://${candidate.github.replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-notion-blue hover:underline"
                  >
                    GitHub
                  </a>
                ) : null}
                {candidate.portfolio ? (
                  <a
                    href={`https://${candidate.portfolio.replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-notion-blue hover:underline"
                  >
                    Portfólio
                  </a>
                ) : null}
                {candidate.linkedin ? (
                  <a
                    href={`https://${candidate.linkedin.replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-notion-blue hover:underline"
                  >
                    LinkedIn
                  </a>
                ) : null}
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Experiências</p>
                <ul className="mt-1 space-y-1 text-graphite">
                  {candidate.experiences.map((e) => (
                    <li key={e.id}>
                      {e.role} — {e.company}
                    </li>
                  ))}
                  {candidate.experiences.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Formação</p>
                <ul className="mt-1 space-y-1 text-graphite">
                  {candidate.educations.map((e) => (
                    <li key={e.id}>
                      {e.course} — {e.institution}
                      {e.endYear ? ` (${e.endYear})` : ""}
                    </li>
                  ))}
                  {candidate.educations.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Certificações</p>
                <ul className="mt-1 space-y-1 text-graphite">
                  {candidate.certifications.map((c) => (
                    <li key={c.id}>
                      {c.name}
                      {c.issuer ? ` — ${c.issuer}` : ""}
                    </li>
                  ))}
                  {candidate.certifications.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Cursos</p>
                <ul className="mt-1 space-y-1 text-graphite">
                  {candidate.coursesTaken.map((c) => (
                    <li key={c.id}>
                      {c.name}
                      {c.issuer ? ` — ${c.issuer}` : ""}
                    </li>
                  ))}
                  {candidate.coursesTaken.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Projetos</p>
                <ul className="mt-1 space-y-1 text-graphite">
                  {candidate.projects.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                  {candidate.projects.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Currículo"
              subtitle="Texto extraído pela IA e arquivo original enviado pelo candidato."
            />
            <CardBody className="space-y-4">
              {candidate.resumes.length === 0 ? (
                <p className="text-sm text-graphite">
                  Nenhum currículo enviado por este candidato.
                </p>
              ) : (
                candidate.resumes.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-black/[0.06] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{r.fileName}</p>
                        <p className="text-xs text-stone">
                          {r.fileType} · enviado em{" "}
                          {new Date(r.uploadedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {r.hasFile ? (
                        <a
                          href={`/api/company/resumes/${r.id}`}
                          className="text-sm font-medium text-notion-blue hover:underline"
                        >
                          Baixar arquivo
                        </a>
                      ) : (
                        <span className="text-xs text-stone">
                          Arquivo indisponível
                        </span>
                      )}
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-graphite hover:text-black">
                        Ver texto extraído
                      </summary>
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-black/[0.03] p-3 text-xs text-graphite">
                        {r.rawText}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Informado vs. comprovado"
              subtitle="Transparência sobre a origem de cada competência."
            />
            <CardBody>
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((s) => (
                  <Badge key={s} tone="green">
                    {s} · forte
                  </Badge>
                ))}
                {gaps.map((s) => (
                  <Badge key={s} tone="red">
                    {s} · lacuna
                  </Badge>
                ))}
                {notAssessed.map((s) => {
                  const o = originLabel(s.origin);
                  return (
                    <Badge key={s.name} tone="yellow">
                      {s.name} · informada{o ? ` (${o})` : ""}
                    </Badge>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-stone">
                {informed.length} competência(s) informada(s) no perfil ·{" "}
                {assessed.length} comprovada(s) por avaliação.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <p className="mt-6 text-xs text-stone">
        A TalentBridge não decide contratações. Os dados acima apoiam a análise
        da empresa, que conduz as etapas seguintes do processo.
      </p>
    </div>
  );
}
