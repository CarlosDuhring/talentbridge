import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-paper-warmth/90 backdrop-blur-md shadow-nav">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" aria-label="TalentBridge — início">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <a
            href="/#como-funciona"
            className="rounded-lg px-4 py-3 text-sm text-black/55 transition-colors hover:text-black"
          >
            Como funciona
          </a>
          <a
            href="/#candidatos"
            className="rounded-lg px-4 py-3 text-sm text-black/55 transition-colors hover:text-black"
          >
            Para candidatos
          </a>
          <a
            href="/#empresas"
            className="rounded-lg px-4 py-3 text-sm text-black/55 transition-colors hover:text-black"
          >
            Para empresas
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="text">
            Entrar
          </ButtonLink>
          <ButtonLink href="/cadastro">Criar conta</ButtonLink>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-graphite">
              Competências comprovadas por avaliação para contratação em
              tecnologia.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-black/50">
              Produto
            </p>
            <ul className="mt-3 space-y-2 text-sm text-graphite">
              <li>
                <a href="/#como-funciona" className="hover:text-black">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="/#candidatos" className="hover:text-black">
                  Para candidatos
                </a>
              </li>
              <li>
                <a href="/#empresas" className="hover:text-black">
                  Para empresas
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-black/50">
              Conta
            </p>
            <ul className="mt-3 space-y-2 text-sm text-graphite">
              <li>
                <Link href="/login" className="hover:text-black">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/cadastro/candidato" className="hover:text-black">
                  Criar conta de candidato
                </Link>
              </li>
              <li>
                <Link href="/cadastro/empresa" className="hover:text-black">
                  Criar conta de empresa
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-black/50">
              Contato e privacidade
            </p>
            <ul className="mt-3 space-y-2 text-sm text-graphite">
              <li>
                <a href="mailto:contato@talentbridge.dev" className="hover:text-black">
                  contato@talentbridge.dev
                </a>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-black">
                  Política de Privacidade (LGPD)
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-black">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-6 text-xs text-stone">
          <p>© {new Date().getFullYear()} TalentBridge. Protótipo demonstrativo.</p>
          <p>Feito para avaliação de competências em tecnologia.</p>
        </div>
      </div>
    </footer>
  );
}
