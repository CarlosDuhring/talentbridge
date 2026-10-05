import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOverallScore } from "@/lib/scoring";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { ProgressBar, scoreBarTone } from "@/components/ui/ProgressBar";
import { ButtonLink } from "@/components/ui/Button";
import { DonutScore, LineChart } from "@/components/charts/Charts";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function CandidateDashboard() {
  const session = await requireCandidate();
  if (!session) return null;
  const candidateId = session.profile.id;

  const store = await cookies();
  if (store.get("tb_welcome_skipped")?.value !== "1") {
    const assessmentCount = await prisma.assessment.count({
      where: { candidateId },
    });
    if (assessmentCount === 0) redirect("/candidato/boas-vindas");
  }

  const [overall, skillScores, assessments, recommendations, resumes] =
    await Promise.all([
      getOverallScore(candidateId),
      prisma.skillScore.findMany({
        where: { candidateId },
        include: { skill: true },
        orderBy: { score: "desc" },
      }),
      prisma.assessment.findMany({
        where: { candidateId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.courseRecommendation.findMany({
        where: { candidateId },
        include: { course: { include: { skill: true } } },
        orderBy: { priority: "asc" },
        take: 3,
      }),
      prisma.resume.findMany({
        where: { candidateId },
        orderBy: { uploadedAt: "desc" },
        take: 1,
      }),
    ]);

  const informedCount = await prisma.candidateSkill.count({
    where: { candidateId, source: "INFORMED" },
  });
  const pending = assessments.find((a) => a.status === "PENDING");

  const completed = await prisma.assessment.findMany({
    where: { candidateId, status: "COMPLETED", completedAt: { not: null } },
    orderBy: { completedAt: "asc" },
    include: { items: { include: { response: true } } },
  });
  const progress = completed
    .map((a) => {
      const scores = a.items
        .map((i) => i.response?.score)
        .filter((s): s is number => typeof s === "number");
      if (scores.length === 0) return null;
      const avg = scores.reduce((acc, s) => acc + s, 0) / scores.length;
      return {
        label: new Date(a.completedAt!).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        }),
        value: avg,
      };
    })
    .filter((p): p is { label: string; value: number } => p !== null);

  return (
    <div>
      <PageHeader
        title={`Olá, ${session.user.name.split(" ")[0]}`}
        subtitle="Acompanhe suas competências, avaliações e recomendações."
        action={
          pending ? (
            <ButtonLink href={`/candidato/avaliacoes/${pending.id}`}>
              Continuar avaliação
            </ButtonLink>
          ) : (
            <ButtonLink href="/candidato/avaliacoes">Ir para avaliações</ButtonLink>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardBody className="flex flex-col items-center py-8">
            {overall !== null ? (
              <DonutScore value={overall} label="Geral" />
            ) : (
              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-full border-4 border-dashed border-black/[0.08] text-center text-xs text-stone">
                Sem avaliações
              </div>
            )}
            <p className="mt-4 text-center text-sm text-graphite">
              {overall !== null
                ? "Média das competências comprovadas por avaliação."
                : "Conclua uma avaliação para gerar sua pontuação."}
            </p>
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader
            title="Competências comprovadas"
            subtitle={`${skillScores.length} avaliadas · ${informedCount} informadas no perfil`}
            action={
              <Link
                href="/candidato/competencias"
                className="text-sm font-medium text-notion-blue hover:underline"
              >
                Ver todas
              </Link>
            }
          />
          <CardBody>
            {skillScores.length === 0 ? (
              <EmptyState
                title="Nenhuma competência avaliada ainda"
                description="Envie seu currículo e faça uma avaliação personalizada para comprovar suas competências."
                action={
                  <ButtonLink href="/candidato/curriculo" variant="ghost">
                    Enviar currículo
                  </ButtonLink>
                }
              />
            ) : (
              <div className="space-y-4">
                {skillScores.slice(0, 5).map((s) => (
                  <div key={s.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{s.skill.name}</span>
                      <span className="tabular-nums text-graphite">
                        {Math.round(s.score)}/100
                      </span>
                    </div>
                    <ProgressBar value={s.score} tone={scoreBarTone(s.score)} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {progress.length > 0 ? (
        <Card className="mt-4">
          <CardHeader
            title="Progresso de desenvolvimento"
            subtitle="Média das competências avaliadas em cada avaliação concluída."
          />
          <CardBody>
            <LineChart data={progress} />
          </CardBody>
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Avaliações" />
          <CardBody className="space-y-3">
            {assessments.length === 0 ? (
              <p className="text-sm text-graphite">Nenhuma avaliação gerada.</p>
            ) : (
              assessments.map((a) => (
                <Link
                  key={a.id}
                  href={
                    a.status === "COMPLETED"
                      ? `/candidato/avaliacoes/${a.id}/resultado`
                      : `/candidato/avaliacoes/${a.id}`
                  }
                  className="flex items-center justify-between rounded-lg border border-black/[0.06] px-3 py-2.5 text-sm transition-colors hover:bg-black/[0.02]"
                >
                  <span className="truncate pr-2">{a.title}</span>
                  <Badge tone={a.status === "COMPLETED" ? "green" : "yellow"}>
                    {a.status === "COMPLETED" ? "Concluída" : "Pendente"}
                  </Badge>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Cursos recomendados" />
          <CardBody className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-graphite">
                Gere recomendações na página de cursos.
              </p>
            ) : (
              recommendations.map((r) => (
                <div key={r.id} className="text-sm">
                  <p className="font-medium leading-snug">{r.course.title}</p>
                  <p className="text-xs text-stone">
                    {r.course.provider} · {r.course.skill.name}
                  </p>
                </div>
              ))
            )}
            <Link
              href="/candidato/cursos"
              className="inline-block text-sm font-medium text-notion-blue hover:underline"
            >
              Ver cursos →
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Currículo" />
          <CardBody className="space-y-3">
            {resumes.length > 0 ? (
              <>
                <p className="text-sm">
                  <span className="font-medium">{resumes[0].fileName}</span>
                </p>
                <p className="text-xs text-stone">
                  Enviado em{" "}
                  {new Date(resumes[0].uploadedAt).toLocaleDateString("pt-BR")}
                </p>
              </>
            ) : (
              <p className="text-sm text-graphite">
                Envie seu currículo para que a IA identifique suas competências
                e personalize suas avaliações.
              </p>
            )}
            <Link
              href="/candidato/curriculo"
              className="inline-block text-sm font-medium text-notion-blue hover:underline"
            >
              {resumes.length > 0 ? "Enviar novo currículo →" : "Enviar currículo →"}
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
