import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { RegisterForm } from "@/components/forms/RegisterForm";

export default function CompanyRegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <div className="w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em]">
          Criar conta de empresa
        </h1>
        <p className="mt-1 text-sm text-graphite">
          Publique vagas e receba candidatos com competências comprovadas.
        </p>
        <div className="mt-6">
          <RegisterForm role="COMPANY" />
        </div>
      </div>
      <Link href="/cadastro" className="mt-6 text-sm text-graphite hover:text-black">
        ← Escolher outro tipo de conta
      </Link>
    </div>
  );
}
