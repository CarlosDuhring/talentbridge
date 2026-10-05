"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function VerifyEmailForm({ email }: { email: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao verificar o código.");
      return;
    }
    router.push(data.redirect);
    router.refresh();
  }

  async function resend() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao reenviar o código.");
      return;
    }
    setDevCode(data.devCode ?? "");
    setCode("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-black/[0.08] bg-paper-warmth px-3 py-2.5 text-sm">
        <p className="font-medium text-black/80">Confirme seu e-mail</p>
        <p className="mt-1 text-graphite">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>.
        </p>
      </div>

      {devCode ? (
        <div className="rounded-lg border border-notion-blue/25 bg-sky-tint/60 px-3 py-2.5 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-notion-blue">
            Modo demonstração
          </p>
          <p className="mt-1 text-graphite">
            Código de verificação:{" "}
            <span className="font-mono text-lg font-semibold tracking-[0.2em] text-black">
              {devCode}
            </span>
          </p>
        </div>
      ) : null}

      <form onSubmit={verify} className="space-y-4">
        <Field label="Código de verificação" required>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="text-center font-mono text-lg tracking-[0.3em]"
            required
            minLength={6}
            maxLength={6}
          />
        </Field>
        {error ? (
          <p className="rounded-lg bg-[#fde8e4] px-3 py-2 text-sm text-vermillion">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Verificando..." : "Verificar e entrar"}
        </Button>
        <button
          type="button"
          onClick={resend}
          disabled={loading}
          className="w-full text-center text-sm font-medium text-notion-blue hover:underline disabled:opacity-40"
        >
          Reenviar código
        </button>
      </form>
    </div>
  );
}
