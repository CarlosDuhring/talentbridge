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

export default async function ComparePage({
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
      candidates: {
        where: { eligible: true },
        include: {
          candidate: {
            include: { user: true, skillScores: { include: { skill: true } } },
          },
        },
      },
    },
  });
  if (!job) notFound();

  const rows = await Promise.all(
    job.candidates.map(async (jc) => {
      const overall = await getOverallScore(jc.candidateId);
      const scoreMap = new Map(
        jc.candidate.skillScores.map((s) => [s.skill.name, s.score])
      );
      return { jc, overall, scoreMap };
    })
  );
  rows.sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0));

  return (
    <div>
      <PageHeader
        title="Comparar candidatos"
        subtitle={`${job.title} · ${rows.length} candidato(s) elegível(is), ordenados pela pontuação geral.`}
        action={
          <ButtonLink href={`/empresa/vagas/${job.id}`} variant="outlined">
            Voltar para a vaga
          </ButtonLink>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-graphite">
              Nenhum candidato elegível para comparar.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/[0.08] text-left">
                <th className="px-5 py-3 font-medium text-graphite">Candidato</th>
                <th className="px-5 py-3 font-medium text-graphite">Geral</th>
                {job.requirements.map((r) => (
                  <th key={r.id} className="px-5 py-3 font-medium text-graphite">
                    <div className="flex flex-col">
                      <span>{r.skill.name}</span>
                      <span className="text-[11px] font-normal text-stone">
                        {r.kind === "MANDATORY" ? "obrigatória" : "desejável"} · mín.{" "}
                        {r.minScore}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ jc, overall, scoreMap }) => (
                <tr
                  key={jc.id}
                  className="border-b border-black/[0.05] last:border-0"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/empresa/candidatos/${jc.candidateId}`}
                      className="font-medium hover:text-notion-blue"
                    >
                      {jc.candidate.user.name}
                    </Link>
                    <p className="text-xs text-stone">
                      {jc.candidate.headline ?? "Candidato"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    {overall !== null ? <ScoreBadge score={overall} /> : "—"}
                  </td>
                  {job.requirements.map((r) => {
                    const score = scoreMap.get(r.skill.name) ?? null;
                    return (
                      <td key={r.id} className="px-5 py-4">
                        <div className="w-[120px]">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="tabular-nums">
                              {score !== null ? Math.round(score) : "—"}
                            </span>
                            {score !== null && score >= r.minScore ? (
                              <Badge tone="green">ok</Badge>
                            ) : (
                              <Badge tone="red">abaixo</Badge>
                            )}
                          </div>
                          <ProgressBar
                            value={score ?? 0}
                            tone={score !== null ? scoreBarTone(score) : "red"}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-5 py-4">
                    <Link
                      href={`/empresa/candidatos/${jc.candidateId}`}
                      className="text-xs font-medium text-notion-blue hover:underline"
                    >
                      Perfil →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="mt-4 text-xs text-stone">
        A comparação é um apoio à decisão. A escolha final é sempre da empresa,
        com base em critérios técnicos e nas etapas do processo seletivo.
      </p>
    </div>
  );
}
