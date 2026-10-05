import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { VerifyEmailForm } from "@/components/forms/VerifyEmailForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <div className="w-full max-w-md rounded-xl border border-black/[0.08] bg-white p-8">
        <h1 className="text-[24px] font-semibold tracking-[-0.02em]">
          Verificação de e-mail
        </h1>
        <p className="mt-1 text-sm text-graphite">
          Falta pouco para acessar sua conta.
        </p>
        <div className="mt-6">
          {email ? (
            <VerifyEmailForm email={email} />
          ) : (
            <p className="text-sm text-graphite">
              Informe seu e-mail no{" "}
              <Link href="/login" className="font-medium text-notion-blue hover:underline">
                login
              </Link>{" "}
              para receber um novo código.
            </p>
          )}
        </div>
      </div>
      <Link href="/login" className="mt-6 text-sm text-graphite hover:text-black">
        ← Voltar para o login
      </Link>
    </div>
  );
}
