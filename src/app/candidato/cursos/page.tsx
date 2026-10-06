import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GenerateCoursesButton } from "@/components/forms/GenerateCoursesButton";
import { safeExternalUrl } from "@/lib/url";

const priorityLabel: Record<number, { label: string; tone: "red" | "yellow" | "blue" }> = {
  1: { label: "Prioridade alta", tone: "red" },
  2: { label: "Prioridade média", tone: "yellow" },
  3: { label: "Complementar", tone: "blue" },
};

export default async function CoursesPage() {
  const session = await requireCandidate();
  if (!session) return null;

  const recommendations = await prisma.courseRecommendation.findMany({
    where: { candidateId: session.profile.id },
    include: { course: { include: { skill: true } } },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Cursos recomendados"
        subtitle="Recomendações geradas a partir das lacunas identificadas nas suas avaliações."
        action={<GenerateCoursesButton />}
      />

      {recommendations.length === 0 ? (
        <EmptyState
          title="Nenhuma recomendação ainda"
          description="Conclua uma avaliação e gere recomendações para receber cursos focados nas suas lacunas."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recommendations.map((r) => {
            const p = priorityLabel[r.priority] ?? priorityLabel[3];
            const url = safeExternalUrl(r.course.url);
            return (
              <Card key={r.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[16px] font-semibold leading-snug">
                        {r.course.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-stone">
                        {r.course.provider} · {r.course.level} · {r.course.hours}h
                      </p>
                    </div>
                    <Badge tone={p.tone}>{p.label}</Badge>
                  </div>
                  <div className="mt-2">
                    <Badge tone="sky">{r.course.skill.name}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-graphite">{r.reason}</p>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-notion-blue hover:underline"
                    >
                      Acessar curso →
                    </a>
                  ) : (
                    <p className="mt-3 text-xs text-stone">
                      Link indisponível para este curso.
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
