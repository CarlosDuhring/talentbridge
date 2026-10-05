import { requireCandidate } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { Badge } from "@/components/ui/Badge";

export default async function ProfilePage() {
  const session = await requireCandidate();
  if (!session) return null;

  const [educations, certifications, courses] = await Promise.all([
    prisma.education.findMany({ where: { candidateId: session.profile.id } }),
    prisma.certification.findMany({ where: { candidateId: session.profile.id } }),
    prisma.candidateCourse.findMany({ where: { candidateId: session.profile.id } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Meu perfil"
        subtitle="Dados de contato, objetivo e links profissionais."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Informações profissionais" />
          <CardBody>
            <ProfileForm
              initial={{
                phone: session.profile.phone ?? "",
                location: session.profile.location ?? "",
                headline: session.profile.headline ?? "",
                objective: session.profile.objective ?? "",
                github: session.profile.github ?? "",
                portfolio: session.profile.portfolio ?? "",
                linkedin: session.profile.linkedin ?? "",
                workCardNotes: session.profile.workCardNotes ?? "",
              }}
            />
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Conta" />
            <CardBody className="space-y-2 text-sm">
              <p>
                <span className="text-stone">Nome:</span> {session.user.name}
              </p>
              <p>
                <span className="text-stone">E-mail:</span> {session.user.email}
              </p>
              <Badge tone="blue">Candidato</Badge>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Formação" subtitle={`${educations.length} registro(s)`} />
            <CardBody className="space-y-3">
              {educations.length === 0 ? (
                <p className="text-sm text-graphite">
                  A formação é preenchida a partir da análise do currículo.
                </p>
              ) : (
                educations.map((e) => (
                  <div key={e.id} className="text-sm">
                    <p className="font-medium">{e.course}</p>
                    <p className="text-xs text-stone">
                      {e.institution}
                      {e.endYear ? ` · ${e.endYear}` : ""}
                    </p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Certificações"
              subtitle={`${certifications.length} registro(s)`}
            />
            <CardBody className="space-y-3">
              {certifications.length === 0 ? (
                <p className="text-sm text-graphite">
                  Certificações identificadas no currículo aparecem aqui.
                </p>
              ) : (
                certifications.map((c) => (
                  <div key={c.id} className="text-sm">
                    <p className="font-medium">{c.name}</p>
                    {c.issuer ? (
                      <p className="text-xs text-stone">{c.issuer}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Cursos" subtitle={`${courses.length} registro(s)`} />
            <CardBody className="space-y-3">
              {courses.length === 0 ? (
                <p className="text-sm text-graphite">
                  Cursos identificados no currículo aparecem aqui.
                </p>
              ) : (
                courses.map((c) => (
                  <div key={c.id} className="text-sm">
                    <p className="font-medium">{c.name}</p>
                    {c.issuer || c.year ? (
                      <p className="text-xs text-stone">
                        {[c.issuer, c.year].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
