import { requireCompany } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompanyProfileForm } from "@/components/forms/CompanyProfileForm";

export default async function CompanyProfilePage() {
  const session = await requireCompany();
  if (!session) return null;

  return (
    <div>
      <PageHeader
        title="Perfil da empresa"
        subtitle="Informações exibidas aos candidatos nos processos seletivos."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Dados da empresa" />
          <CardBody>
            <CompanyProfileForm
              initial={{
                tradeName: session.profile.tradeName,
                sector: session.profile.sector ?? "",
                location: session.profile.location ?? "",
                website: session.profile.website ?? "",
                description: session.profile.description ?? "",
              }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Conta" />
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-stone">Responsável:</span> {session.user.name}
            </p>
            <p>
              <span className="text-stone">E-mail:</span> {session.user.email}
            </p>
            <Badge tone="purple">Empresa</Badge>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
