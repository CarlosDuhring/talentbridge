import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOverallScore } from "@/lib/scoring";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { ProgressBar, scoreBarTone } from "@/components/ui/ProgressBar";
import { ButtonLink } from "@/components/ui/Button";
import { StageSelect } from "@/components/forms/StageSelect";
import { JobStatusToggle } from "@/components/forms/JobStatusToggle";

const stageLabels: Record<string, string> = {
  ELIGIBLE: "Elegível",
  IN_REVIEW: "Em análise",
  INTERVIEW: "Entrevista",
  SELECTED: "Selecionado",
  HIRED: "Contratado",
  REJECTED: "Não selecionado",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCompany();
  if (!session) return null;

  const { id } = await params;
  const job = await prisma.job.findFirst({
    where: { id, companyId: session.profile.id },
    include: {
      requirements: { include: { skill: true } },
      analysis: true,
      candidates: {
        include: {
          candidate: { include: { user: true, skillScores: { include: { skill: true } } } },
        },
      },
    },
  });
  if (!job) notFound();

  const eligible = job.candidates.filter((c) => c.eligible);
  const ineligible = job.candidates.filter((c) => !c.eligible);

  const rows = await Promise.all(
    eligible.map(async (jc) => {
      const overall = await getOverallScore(jc.candidateId);
      const scoreMap = new Map(
        jc.candidate.skillScores.map((s) => [s.skill.name, s.score])
      );
      const reqScores = job.requirements.map((r) => ({
        name: r.skill.name,
        kind: r.kind,
        minScore: r.minScore,
        score: scoreMap.get(r.skill.name) ?? null,
      }));
      return { jc, overall, reqScores };
    })
  );
  rows.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  const analysis = job.analysis
    ? (JSON.parse(job.analysis.data) as { summary?: string })
    : null;

  return (
    <div>
      <PageHeader
        title={job.title}
        subtitle={`${job.location ? `${job.location} · ` : ""}nível ${job.level} · ${
          job.status === "OPEN" ? "aberta" : "fechada"
        }`}
        action={
          <div className="flex items-center gap-2">
            <JobStatusToggle jobId={job.id} status={job.status} />
            <ButtonLink href={`/empresa/vagas/${job.id}/comparar`} variant="outlined">
              Comparar candidatos
            </ButtonLink>
            <ButtonLink href="/empresa/vagas" variant="text">
              Voltar
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Descrição da vaga" />
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-graphite">
              {job.description}
            </p>
            {analysis?.summary ? (
              <p className="mt-4 rounded-lg bg-sky-tint/50 px-4 py-3 text-sm text-graphite">
                <span className="font-medium text-black/80">Análise da IA: </span>
                {analysis.summary}
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Critérios de elegibilidade" />
          <CardBody className="space-y-3">
            {job.requirements.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{r.skill.name}</span>
                  <Badge tone={r.kind === "MANDATORY" ? "blue" : "neutral"}>
                    {r.kind === "MANDATORY" ? "Obrigatória" : "Desejável"}
                  </Badge>
                </div>
                <span className="tabular-nums text-graphite">≥ {r.minScore}</span>
              </div>
            ))}
            <div className="border-t border-black/[0.06] pt-3 text-sm">
              <div className="flex justify-between">
                <span>Experiência mínima</span>
                <span className="tabular-nums text-graphite">
                  {job.minExperienceYears} ano(s)
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Pontuação geral mínima</span>
                <span className="tabular-nums text-graphite">
                  {job.minOverallScore}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-[20px] font-semibold">
        Candidatos elegíveis ({rows.length})
      </h2>
      {rows.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-graphite">
              Nenhum candidato elegível no momento. Candidatos aparecem aqui
              automaticamente quando comprovam as competências obrigatórias.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map(({ jc, overall, reqScores }) => (
            <Card key={jc.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/empresa/candidatos/${jc.candidateId}`}
                        className="text-[17px] font-semibold hover:text-notion-blue"
                      >
                        {jc.candidate.user.name}
                      </Link>
                      {overall !== null ? <ScoreBadge score={overall} /> : null}
                    </div>
                    <p className="mt-0.5 text-sm text-graphite">
                      {jc.candidate.headline ?? "Candidato"}
                      {jc.candidate.location ? ` · ${jc.candidate.location}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="purple">{stageLabels[jc.stage] ?? jc.stage}</Badge>
                    <StageSelect
                      jobId={job.id}
                      candidateId={jc.candidateId}
                      stage={jc.stage}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {reqScores.map((r) => (
                    <div key={r.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">
                          {r.name}{" "}
                          <span className="text-stone">
                            ({r.kind === "MANDATORY" ? "obrigatória" : "desejável"})
                          </span>
                        </span>
                        <span className="tabular-nums text-graphite">
                          {r.score !== null ? Math.round(r.score) : "—"} / mín.{" "}
                          {r.minScore}
                        </span>
                      </div>
                      <ProgressBar
                        value={r.score ?? 0}
                        tone={r.score !== null ? scoreBarTone(r.score) : "red"}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Link
                    href={`/empresa/candidatos/${jc.candidateId}`}
                    className="text-sm font-medium text-notion-blue hover:underline"
                  >
                    Ver perfil completo →
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {ineligible.length > 0 ? (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-graphite hover:text-black">
            Auditoria de inelegíveis ({ineligible.length}) — visível apenas para a
            empresa
          </summary>
          <div className="mt-3 space-y-2">
            {ineligible.map((jc) => {
              const reasons = jc.reasons ? (JSON.parse(jc.reasons) as string[]) : [];
              return (
                <div
                  key={jc.id}
                  className="rounded-lg border border-black/[0.06] bg-white px-4 py-3 text-sm"
                >
                  <p className="font-medium">{jc.candidate.user.name}</p>
                  <ul className="mt-1 list-inside list-disc text-xs text-graphite">
                    {reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
