"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function AppShell({
  items,
  user,
  roleLabel,
  children,
}: {
  items: NavItem[];
  user: { name: string; email: string };
  roleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/candidato" && href !== "/empresa" && pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            isActive(item.href)
              ? "bg-sky-tint font-medium text-notion-blue"
              : "text-black/60 hover:bg-black/[0.04] hover:text-black"
          }`}
        >
          <span className="shrink-0">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-black/[0.06] bg-white md:flex">
        <div className="flex h-16 items-center border-b border-black/[0.06] px-5">
          <Link href={items[0]?.href ?? "/"}>
            <Logo />
          </Link>
        </div>
        <div className="py-4">{nav}</div>
        <div className="border-t border-black/[0.06] p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-stone">{roleLabel}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-black/[0.12] px-3 py-2 text-sm text-black/70 transition-colors hover:bg-black/[0.03]"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-black/[0.06] bg-paper-warmth/90 px-4 backdrop-blur-md md:hidden">
          <Link href={items[0]?.href ?? "/"}>
            <Logo size="sm" />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg border border-black/[0.12] px-3 py-2 text-sm"
            aria-label="Abrir menu"
          >
            {open ? "Fechar" : "Menu"}
          </button>
        </header>
        {open ? (
          <div className="border-b border-black/[0.06] bg-white py-3 md:hidden">
            {nav}
            <div className="mt-2 border-t border-black/[0.06] px-4 pt-3">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-stone">{roleLabel}</p>
              <button
                onClick={logout}
                className="mt-2 rounded-lg border border-black/[0.12] px-3 py-2 text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        ) : null}
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
