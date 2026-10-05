import { requireCandidate } from "@/lib/auth";
import { getCandidateReport } from "@/lib/scoring";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { ProgressBar, scoreBarTone } from "@/components/ui/ProgressBar";
import { DonutScore, RadarChart } from "@/components/charts/Charts";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { originLabel, originTone } from "@/lib/origins";

export default async function ReportPage() {
  const session = await requireCandidate();
  if (!session) return null;

  const report = await getCandidateReport(session.profile.id);
  if (!report) return null;

  const { candidate, overall, assessed, strengths, gaps, informed, notAssessed } =
    report;

  return (
    <div>
      <PageHeader
        title="Relatório de competências"
        subtitle="Visão consolidada do seu perfil: o que foi informado, o que foi comprovado e o que falta desenvolver."
      />

      {assessed.length === 0 ? (
        <EmptyState
          title="Relatório indisponível"
          description="Conclua ao menos uma avaliação para gerar seu relatório de competências."
          action={
            <ButtonLink href="/candidato/avaliacoes" variant="ghost">
              Ir para avaliações
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardBody className="flex flex-col items-center py-8">
                <DonutScore value={overall ?? 0} label="Geral" />
                <p className="mt-4 text-center text-sm text-graphite">
                  Média das {assessed.length} competências comprovadas.
                </p>
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Mapa de competências"
                subtitle="Somente competências comprovadas por avaliação."
              />
              <CardBody className="flex justify-center">
                <RadarChart
                  data={assessed.slice(0, 8).map((s) => ({
                    label: s.name,
                    value: s.score,
                  }))}
                />
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Pontos fortes" subtitle="Nota ≥ 80" />
              <CardBody>
                {strengths.length === 0 ? (
                  <p className="text-sm text-graphite">
                    Nenhuma competência acima de 80 ainda.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {strengths.map((s) => (
                      <Badge key={s} tone="green">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Pontos a desenvolver" subtitle="Nota < 70" />
              <CardBody>
                {gaps.length === 0 ? (
                  <p className="text-sm text-graphite">
                    Nenhuma lacuna crítica identificada.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {gaps.map((s) => (
                      <Badge key={s} tone="red">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Informadas sem comprovação"
                subtitle={`${notAssessed.length} competência(s)`}
              />
              <CardBody>
                {notAssessed.length === 0 ? (
                  <p className="text-sm text-graphite">
                    Todas as competências informadas foram comprovadas.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {notAssessed.map((s) => {
                      const o = originLabel(s.origin);
                      return (
                        <Badge key={s.name} tone="yellow">
                          {s.name}
                          {o ? ` · ${o}` : ""}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader
              title="Detalhamento por competência"
              subtitle="Nota, origem e itens que compuseram o resultado."
            />
            <CardBody className="space-y-4">
              {assessed.map((s) => (
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
              ))}
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader
              title="Competências informadas"
              subtitle="Extraídas do currículo, experiências e projetos — ainda não comprovadas."
            />
            <CardBody>
              <div className="grid gap-2 md:grid-cols-2">
                {informed.map((i) => {
                  const o = originLabel(i.origin);
                  return (
                    <div
                      key={i.name}
                      className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.06] px-3 py-2 text-sm"
                    >
                      <span>{i.name}</span>
                      <span className="flex items-center gap-1.5">
                        {o ? <Badge tone={originTone(i.origin)}>{o}</Badge> : null}
                        <Badge tone="neutral">{i.category}</Badge>
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader
              title="Informações do perfil"
              subtitle="Origem das competências informadas: currículo, experiências, formação e projetos."
            />
            <CardBody className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[13px] font-medium text-black/80">Experiências</p>
                <ul className="mt-2 space-y-2 text-sm text-graphite">
                  {candidate.experiences.map((e) => (
                    <li key={e.id}>
                      <span className="font-medium text-black">{e.role}</span> —{" "}
                      {e.company}
                      <span className="block text-xs text-stone">
                        {new Date(e.startDate).toLocaleDateString("pt-BR", {
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        –{" "}
                        {e.current
                          ? "atual"
                          : e.endDate
                            ? new Date(e.endDate).toLocaleDateString("pt-BR", {
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        {e.registered ? " · registrada em carteira" : ""}
                      </span>
                    </li>
                  ))}
                  {candidate.experiences.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Formação</p>
                <ul className="mt-2 space-y-2 text-sm text-graphite">
                  {candidate.educations.map((e) => (
                    <li key={e.id}>
                      <span className="font-medium text-black">{e.course}</span> —{" "}
                      {e.institution}
                      <span className="block text-xs text-stone">
                        {e.level}
                        {e.endYear ? ` · conclusão ${e.endYear}` : ""}
                      </span>
                    </li>
                  ))}
                  {candidate.educations.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Certificações</p>
                <ul className="mt-2 space-y-2 text-sm text-graphite">
                  {candidate.certifications.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium text-black">{c.name}</span>
                      {c.issuer ? ` — ${c.issuer}` : ""}
                      {c.year ? (
                        <span className="block text-xs text-stone">{c.year}</span>
                      ) : null}
                    </li>
                  ))}
                  {candidate.certifications.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Cursos</p>
                <ul className="mt-2 space-y-2 text-sm text-graphite">
                  {candidate.coursesTaken.map((c) => (
                    <li key={c.id}>
                      <span className="font-medium text-black">{c.name}</span>
                      {c.issuer || c.year ? (
                        <span className="block text-xs text-stone">
                          {[c.issuer, c.year].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                  {candidate.coursesTaken.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
              <div>
                <p className="text-[13px] font-medium text-black/80">Projetos</p>
                <ul className="mt-2 space-y-2 text-sm text-graphite">
                  {candidate.projects.map((p) => (
                    <li key={p.id}>
                      <span className="font-medium text-black">{p.name}</span>
                      {p.description ? (
                        <span className="block text-xs text-stone">
                          {p.description}
                        </span>
                      ) : null}
                    </li>
                  ))}
                  {candidate.projects.length === 0 ? <li>—</li> : null}
                </ul>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
