import { notFound, redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { AssessmentRunner } from "@/components/forms/AssessmentRunner";

export default async function TakeAssessmentPage({
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
      items: { include: { skill: true }, orderBy: { order: "asc" } },
    },
  });
  if (!assessment) notFound();
  if (assessment.status === "COMPLETED") {
    redirect(`/candidato/avaliacoes/${assessment.id}/resultado`);
  }

  return (
    <div>
      <PageHeader
        title={assessment.title}
        subtitle={`${assessment.items.length} itens · nível ${assessment.level}. Responda com calma; a correção é automática.`}
      />
      <AssessmentRunner
        assessmentId={assessment.id}
        items={assessment.items.map((i) => ({
          id: i.id,
          type: i.type,
          prompt: i.prompt,
          options: i.options ? JSON.parse(i.options) : null,
          starterCode: i.starterCode,
          language: i.language,
          skillName: i.skill.name,
        }))}
      />
    </div>
  );
}
