import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { ProgressBar, scoreBarTone } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";

export default async function SkillsPage() {
  const session = await requireCandidate();
  if (!session) return null;
  const candidateId = session.profile.id;

  const [assessed, informed] = await Promise.all([
    prisma.skillScore.findMany({
      where: { candidateId },
      include: { skill: true },
      orderBy: { score: "desc" },
    }),
    prisma.candidateSkill.findMany({
      where: { candidateId, source: "INFORMED" },
      include: { skill: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const assessedNames = new Set(assessed.map((a) => a.skill.name));
  const onlyInformed = informed.filter((i) => !assessedNames.has(i.skill.name));

  return (
    <div>
      <PageHeader
        title="Competências"
        subtitle="Separação clara entre o que você informou e o que foi comprovado por avaliação."
        action={
          <ButtonLink href="/candidato/avaliacoes" variant="outlined">
            Fazer avaliação
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Comprovadas por avaliação"
            subtitle={`${assessed.length} competência(s)`}
          />
          <CardBody>
            {assessed.length === 0 ? (
              <EmptyState
                title="Nenhuma competência comprovada"
                description="Gere uma avaliação personalizada para comprovar suas competências."
              />
            ) : (
              <div className="space-y-4">
                {assessed.map((s) => (
                  <div key={s.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s.skill.name}</span>
                        <Badge tone="neutral">{s.skill.category}</Badge>
                      </div>
                      <ScoreBadge score={s.score} />
                    </div>
                    <ProgressBar value={s.score} tone={scoreBarTone(s.score)} />
                    {s.breakdown ? (
                      <p className="mt-1 text-xs text-stone">{s.breakdown}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Informadas no perfil"
            subtitle={`${onlyInformed.length} ainda sem comprovação`}
          />
          <CardBody>
            {onlyInformed.length === 0 ? (
              <p className="text-sm text-graphite">
                Todas as competências informadas já foram comprovadas por
                avaliação.
              </p>
            ) : (
              <div className="space-y-3">
                {onlyInformed.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-black/[0.06] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium">{s.skill.name}</span>
                      <Badge tone="yellow">Não comprovada</Badge>
                    </div>
                    {s.evidence ? (
                      <p className="mt-1 text-xs text-stone">{s.evidence}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
