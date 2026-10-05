import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { DeleteButton } from "@/components/forms/ExperienceForm";

export default async function ProjectsPage() {
  const session = await requireCandidate();
  if (!session) return null;

  const projects = await prisma.project.findMany({
    where: { candidateId: session.profile.id },
    orderBy: { id: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Projetos"
        subtitle="Projetos pessoais e profissionais que demonstram suas competências."
        action={<ProjectForm />}
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Nenhum projeto cadastrado"
          description="Adicione projetos com as tecnologias utilizadas para enriquecer seu perfil."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[17px] font-semibold">{p.name}</h3>
                  <DeleteButton endpoint="/api/candidate/projects" id={p.id} />
                </div>
                {p.description ? (
                  <p className="mt-2 text-sm text-graphite">{p.description}</p>
                ) : null}
                {p.technologies ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.technologies
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t) => (
                        <Badge key={t} tone="sky">
                          {t}
                        </Badge>
                      ))}
                  </div>
                ) : null}
                <div className="mt-3 flex gap-4 text-sm">
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-notion-blue hover:underline"
                    >
                      Ver projeto
                    </a>
                  ) : null}
                  {p.repo ? (
                    <a
                      href={p.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-notion-blue hover:underline"
                    >
                      Repositório
                    </a>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
