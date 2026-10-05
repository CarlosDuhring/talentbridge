import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { GenerateAssessmentButton } from "@/components/forms/GenerateAssessmentButton";
import { SkipAssessmentButton } from "@/components/forms/SkipAssessmentButton";

export default async function WelcomeAssessmentPage() {
  const session = await requireCandidate();
  if (!session) return null;

  const [informedCount, pending] = await Promise.all([
    prisma.candidateSkill.count({
      where: { candidateId: session.profile.id, source: "INFORMED" },
    }),
    prisma.assessment.findFirst({
      where: { candidateId: session.profile.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Bem-vindo(a), ${session.user.name.split(" ")[0]}!`}
        subtitle="Sua conta foi criada e seu currículo já foi analisado pela IA."
      />

      <Card>
        <CardHeader
          title="Deseja fazer seus testes de competências agora?"
          subtitle="As questões são geradas pela IA com base no que está no seu currículo — nada de banco de perguntas pronto. Você pode pular e fazer quando quiser."
        />
        <CardBody className="space-y-5">
          <div className="space-y-2 text-sm text-graphite">
            <p>
              Ao fazer agora, a IA monta uma avaliação com questões de múltipla
              escolha, resposta aberta e, quando houver linguagem no seu
              currículo, um desafio de código com correção automática.
            </p>
            <p>
              Suas competências só ficam <strong>comprovadas</strong> depois dos
              testes. Antes disso, elas aparecem apenas como{" "}
              <strong>informadas</strong> no seu perfil.
            </p>
          </div>

          {pending ? (
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href={`/candidato/avaliacoes/${pending.id}`}>
                Continuar avaliação
              </ButtonLink>
              <SkipAssessmentButton />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <GenerateAssessmentButton hasSkills={informedCount > 0} label="Fazer agora" />
              <SkipAssessmentButton />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
