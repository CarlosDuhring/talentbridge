import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";

export default function RegisterChoicePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <div className="w-full max-w-2xl">
        <h1 className="text-center text-[28px] font-semibold tracking-[-0.02em]">
          Como você vai usar a TalentBridge?
        </h1>
        <p className="mt-2 text-center text-sm text-graphite">
          Escolha o tipo de conta. Você poderá completar seu perfil na sequência.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link href="/cadastro/candidato" className="group">
            <Card className="h-full p-6 transition-colors group-hover:border-notion-blue/40">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-tint text-notion-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <h2 className="mt-4 text-[20px] font-semibold">Sou candidato</h2>
              <p className="mt-2 text-sm text-graphite">
                Crie seu perfil, envie o currículo, faça avaliações
                personalizadas e receba recomendações de cursos.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-notion-blue">
                Criar conta de candidato →
              </span>
            </Card>
          </Link>
          <Link href="/cadastro/empresa" className="group">
            <Card className="h-full p-6 transition-colors group-hover:border-notion-blue/40">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ece9fb] text-[#5b4bc4]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <h2 className="mt-4 text-[20px] font-semibold">Sou empresa</h2>
              <p className="mt-2 text-sm text-graphite">
                Crie vagas, defina critérios, visualize candidatos elegíveis,
                compare pontuações e conduza o processo seletivo.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-notion-blue">
                Criar conta de empresa →
              </span>
            </Card>
          </Link>
        </div>
        <p className="mt-6 text-center text-sm text-graphite">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-notion-blue hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
