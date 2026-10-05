import Link from "next/link";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GenerateAssessmentButton } from "@/components/forms/GenerateAssessmentButton";

export default async function AssessmentsPage() {
  const session = await requireCandidate();
  if (!session) return null;

  const [assessments, skillCount] = await Promise.all([
    prisma.assessment.findMany({
      where: { candidateId: session.profile.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.candidateSkill.count({ where: { candidateId: session.profile.id } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Avaliações"
        subtitle="Avaliações personalizadas geradas por IA a partir do seu perfil, com correção automática e feedback."
        action={<GenerateAssessmentButton hasSkills={skillCount > 0} />}
      />

      {assessments.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação ainda"
          description="Gere uma avaliação personalizada. Ela combina questões de múltipla escolha, respostas abertas e desafios de código conforme suas competências."
        />
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => {
            const href =
              a.status === "COMPLETED"
                ? `/candidato/avaliacoes/${a.id}/resultado`
                : `/candidato/avaliacoes/${a.id}`;
            return (
              <Link key={a.id} href={href} className="block">
                <Card className="transition-colors hover:border-notion-blue/30">
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[16px] font-semibold">{a.title}</h3>
                      <p className="mt-0.5 text-xs text-stone">
                        {a.items.length} itens · nível {a.level} ·{" "}
                        {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge tone={a.status === "COMPLETED" ? "green" : "yellow"}>
                      {a.status === "COMPLETED" ? "Concluída" : "Pendente"}
                    </Badge>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
