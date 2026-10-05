import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExperienceForm, DeleteButton } from "@/components/forms/ExperienceForm";

function formatMonth(value: string) {
  if (!value) return "";
  const [y, m] = value.split("-");
  const months = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  const idx = parseInt(m, 10) - 1;
  return `${months[idx] ?? m}/${y}`;
}

export default async function ExperiencesPage() {
  const session = await requireCandidate();
  if (!session) return null;

  const experiences = await prisma.experience.findMany({
    where: { candidateId: session.profile.id },
    orderBy: { startDate: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Experiências"
        subtitle="Histórico profissional. As tecnologias informadas viram competências do tipo INFORMADO."
        action={<ExperienceForm />}
      />

      {experiences.length === 0 ? (
        <EmptyState
          title="Nenhuma experiência cadastrada"
          description="Adicione suas experiências profissionais ou envie um currículo para preenchimento automático."
        />
      ) : (
        <div className="space-y-3">
          {experiences.map((e) => (
            <Card key={e.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[17px] font-semibold">{e.role}</h3>
                    <p className="text-sm text-graphite">{e.company}</p>
                    <p className="mt-0.5 text-xs text-stone">
                      {formatMonth(e.startDate)} —{" "}
                      {e.current ? "atual" : formatMonth(e.endDate ?? "")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {e.registered ? (
                      <Badge tone="purple">Registrada</Badge>
                    ) : (
                      <Badge tone="neutral">Não registrada</Badge>
                    )}
                    <DeleteButton
                      endpoint="/api/candidate/experiences"
                      id={e.id}
                    />
                  </div>
                </div>
                {e.description ? (
                  <p className="mt-3 text-sm text-graphite">{e.description}</p>
                ) : null}
                {e.technologies ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {e.technologies
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
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
