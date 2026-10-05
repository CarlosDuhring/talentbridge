"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verificar-email?email=${encodeURIComponent(data.email ?? email)}`);
        return;
      }
      setError(data.error ?? "Erro ao entrar.");
      return;
    }
    router.push(data.redirect);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-mail" required>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@exemplo.com"
          required
          autoComplete="email"
        />
      </Field>
      <Field label="Senha" required>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </Field>
      {error ? (
        <p className="rounded-lg bg-[#fde8e4] px-3 py-2 text-sm text-vermillion">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-graphite">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-notion-blue hover:underline">
          Criar conta
        </Link>
      </p>
      <div className="rounded-lg border border-black/[0.08] bg-paper-warmth px-3 py-2.5 text-xs text-graphite">
        <p className="font-medium text-black/70">Conta demo (senha: demo1234)</p>
        <p className="mt-1">Empresa: empresa@talentbridge.dev</p>
      </div>
    </form>
  );
}
