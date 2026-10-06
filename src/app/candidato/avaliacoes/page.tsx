import Link from "next/link";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AssessmentSkillPicker } from "@/components/forms/AssessmentSkillPicker";

export default async function AssessmentsPage() {
  const session = await requireCandidate();
  if (!session) return null;

  const assessments = await prisma.assessment.findMany({
    where: { candidateId: session.profile.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Avaliações"
        subtitle="Escolha uma competência, responda 10 questões e receba uma pontuação de 0 a 100."
      />

      <div className="mb-8">
        <AssessmentSkillPicker />
      </div>

      <h2 className="mb-3 text-[20px] font-semibold">Suas avaliações</h2>
      {assessments.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação ainda"
          description="Escolha uma competência acima para começar. Cada avaliação tem 10 questões e gera uma pontuação."
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
