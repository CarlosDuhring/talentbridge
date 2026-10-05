import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { ProgressBar, scoreBarTone } from "@/components/ui/ProgressBar";
import { ButtonLink } from "@/components/ui/Button";

export default async function AssessmentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireCandidate();
  if (!session) return null;

  const { id } = await params;
  const assessment = await prisma.assessment.findFirst({
    where: { id, candidateId: session.profile.id },
    include: {
      items: {
        include: { skill: true, response: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!assessment || assessment.status !== "COMPLETED") notFound();

  const bySkill = new Map<string, { name: string; scores: number[] }>();
  for (const item of assessment.items) {
    if (!item.response) continue;
    const entry = bySkill.get(item.skillId) ?? {
      name: item.skill.name,
      scores: [],
    };
    entry.scores.push(item.response.score);
    bySkill.set(item.skillId, entry);
  }

  const total = assessment.items.reduce(
    (acc, i) => acc + (i.response?.score ?? 0),
    0
  );
  const avg = assessment.items.length
    ? Math.round(total / assessment.items.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Resultado da avaliação"
        subtitle={`${assessment.title} · concluída em ${
          assessment.completedAt
            ? new Date(assessment.completedAt).toLocaleDateString("pt-BR")
            : ""
        }`}
        action={
          <ButtonLink href="/candidato/avaliacoes" variant="outlined">
            Voltar
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center py-8">
            <ScoreBadge score={avg} />
            <p className="mt-3 text-center text-sm text-graphite">
              Média dos {assessment.items.length} itens desta avaliação.
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Desempenho por competência"
            subtitle="Média dos itens de cada competência nesta avaliação."
          />
          <CardBody className="space-y-4">
            {[...bySkill.values()].map((s) => {
              const score =
                s.scores.reduce((a, b) => a + b, 0) / Math.max(s.scores.length, 1);
              return (
                <div key={s.name}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="tabular-nums text-graphite">
                      {Math.round(score)}/100
                    </span>
                  </div>
                  <ProgressBar value={score} tone={scoreBarTone(score)} />
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-[20px] font-semibold">Correção item a item</h2>
      <div className="space-y-3">
        {assessment.items.map((item, idx) => (
          <Card key={item.id}>
            <CardBody>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone">
                    {idx + 1}.
                  </span>
                  <Badge tone="blue">{item.skill.name}</Badge>
                  <Badge tone="neutral">
                    {item.type === "MULTIPLE_CHOICE"
                      ? "Múltipla escolha"
                      : item.type === "OPEN"
                        ? "Aberta"
                        : "Código"}
                  </Badge>
                </div>
                {item.response ? <ScoreBadge score={item.response.score} /> : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-graphite">
                {item.prompt}
              </p>
              {item.response ? (
                <div className="mt-3 rounded-lg bg-paper-warmth px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone">
                    Sua resposta
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {item.type === "MULTIPLE_CHOICE" && item.options
                      ? (() => {
                          const opts = JSON.parse(item.options) as string[];
                          const chosen = parseInt(item.response!.answer, 10);
                          return opts[chosen] ?? item.response!.answer;
                        })()
                      : item.response.answer}
                  </p>
                  {item.response.feedback ? (
                    <p className="mt-2 text-sm text-graphite">
                      <span className="font-medium text-black/80">Feedback: </span>
                      {item.response.feedback}
                    </p>
                  ) : null}
                  {item.response.breakdown ? (
                    <p className="mt-1 text-xs text-stone">
                      {item.response.breakdown}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <ButtonLink href="/candidato/competencias" variant="ghost">
          Ver competências atualizadas
        </ButtonLink>
        <Link
          href="/candidato/cursos"
          className="inline-flex items-center text-sm font-medium text-notion-blue hover:underline"
        >
          Ver cursos recomendados →
        </Link>
      </div>
    </div>
  );
}
