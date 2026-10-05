import { requireCompany } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { JobForm } from "@/components/forms/JobForm";

export default async function NewJobPage() {
  const session = await requireCompany();
  if (!session) return null;

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeader
        title="Nova vaga"
        subtitle="Descreva a vaga em linguagem natural. A IA extrai os critérios técnicos e você revisa antes de publicar."
      />
      <JobForm />
    </div>
  );
}
