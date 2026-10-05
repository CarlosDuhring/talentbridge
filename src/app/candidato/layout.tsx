import { redirect } from "next/navigation";
import { requireCandidate } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import {
  IconGrid,
  IconUser,
  IconBriefcase,
  IconFolder,
  IconFile,
  IconChart,
  IconCheck,
  IconBook,
  IconReport,
} from "@/components/layout/Icons";

export default async function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCandidate();
  if (!session) redirect("/login");

  const items = [
    { href: "/candidato", label: "Visão geral", icon: <IconGrid /> },
    { href: "/candidato/perfil", label: "Meu perfil", icon: <IconUser /> },
    { href: "/candidato/experiencias", label: "Experiências", icon: <IconBriefcase /> },
    { href: "/candidato/projetos", label: "Projetos", icon: <IconFolder /> },
    { href: "/candidato/curriculo", label: "Currículo", icon: <IconFile /> },
    { href: "/candidato/competencias", label: "Competências", icon: <IconChart /> },
    { href: "/candidato/avaliacoes", label: "Avaliações", icon: <IconCheck /> },
    { href: "/candidato/cursos", label: "Cursos recomendados", icon: <IconBook /> },
    { href: "/candidato/relatorio", label: "Relatório", icon: <IconReport /> },
  ];

  return (
    <AppShell
      items={items}
      user={{ name: session.user.name, email: session.user.email }}
      roleLabel="Candidato"
    >
      {children}
    </AppShell>
  );
}
