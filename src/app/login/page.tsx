import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <div className="w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em]">Entrar</h1>
        <p className="mt-1 text-sm text-graphite">
          Acesse sua área de candidato ou empresa.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
      <Link href="/" className="mt-6 text-sm text-graphite hover:text-black">
        ← Voltar para a página inicial
      </Link>
    </div>
  );
}
