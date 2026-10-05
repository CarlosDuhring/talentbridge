import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import {
  IconGrid,
  IconBriefcase,
  IconPlus,
  IconUser,
  IconShield,
} from "@/components/layout/Icons";

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCompany();
  if (!session) redirect("/login");

  const items = [
    { href: "/empresa", label: "Dashboard", icon: <IconGrid /> },
    { href: "/empresa/vagas", label: "Vagas", icon: <IconBriefcase /> },
    { href: "/empresa/vagas/nova", label: "Nova vaga", icon: <IconPlus /> },
    { href: "/empresa/perfil", label: "Perfil da empresa", icon: <IconUser /> },
    { href: "/empresa/auditoria", label: "Auditoria", icon: <IconShield /> },
  ];

  return (
    <AppShell
      items={items}
      user={{ name: session.user.name, email: session.user.email }}
      roleLabel={session.profile.tradeName}
    >
      {children}
    </AppShell>
  );
}
