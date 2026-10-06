"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { PASSWORD_RULES } from "@/lib/password";
import { formatPhoneBR } from "@/lib/format";

type Skill = { name: string; category: string; evidence: string };

type Analysis = {
  summary: string;
  skills: Skill[];
  experiences: { role: string; company: string }[];
  education: { course: string; institution: string }[];
};

const PENDING_KEY = "tb_pending_registration";

type PendingRegistration = {
  email: string;
  devCode: string;
  analysis: Analysis | null;
  selected: string[];
};

function readPending(): PendingRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingRegistration) : null;
  } catch {
    return null;
  }
}

const LOADING_STEPS = [
  "Criando sua conta",
  "Lendo o currículo",
  "Identificando competências com IA",
  "Preparando a revisão",
];

export function RegisterForm({ role }: { role: "CANDIDATE" | "COMPANY" }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    const pending = readPending();
    if (!pending) return;
    setEmail(pending.email);
    setDevCode(pending.devCode);
    setAnalysis(pending.analysis);
    setSelected(new Set(pending.selected));
    setStep("verify");
  }, []);

  const passwordChecks = useMemo(
    () => PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) })),
    [password]
  );
  const passwordStrong = passwordChecks.every((c) => c.ok);

  function toggleSkill(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordStrong) {
      setError("A senha ainda não atende a todos os requisitos.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (role === "CANDIDATE" && !resume) {
      setError("Anexe seu currículo (PDF ou DOCX) para criar a conta.");
      return;
    }
    setLoading(true);
    setLoadingStep(0);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("passwordConfirm", passwordConfirm);
    formData.append("role", role);
    if (role === "COMPANY") formData.append("companyName", companyName);
    if (role === "CANDIDATE") {
      formData.append("phone", phone);
      if (resume) formData.append("resume", resume);
    }

    const timer =
      role === "CANDIDATE"
        ? setInterval(() => {
            setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
          }, 1200)
        : null;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: formData,
    });
    if (timer) clearInterval(timer);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao criar conta.");
      return;
    }
    setDevCode(data.devCode ?? "");
    const result: Analysis | null = data.resumeAnalysis ?? null;
    setAnalysis(result);
    const selectedNames = result?.skills.map((s) => s.name) ?? [];
    setSelected(new Set(selectedNames));
    try {
      window.sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({
          email,
          devCode: data.devCode ?? "",
          analysis: result,
          selected: selectedNames,
        } satisfies PendingRegistration)
      );
    } catch {
      /* sessionStorage indisponível */
    }
    setStep("verify");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const skills = analysis
      ? analysis.skills.filter((s) => selected.has(s.name))
      : [];
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, skills }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao verificar o código.");
      return;
    }
    try {
      window.sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* sessionStorage indisponível */
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

  if (loading && step === "form") {
    return (
      <LoadingOverlay
        title={
          role === "CANDIDATE"
            ? "Criando sua conta e analisando o currículo"
            : "Criando sua conta"
        }
        steps={role === "CANDIDATE" ? LOADING_STEPS : LOADING_STEPS.slice(0, 1)}
        activeStep={loadingStep}
      />
    );
  }

  if (step === "verify") {
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

        {analysis ? (
          <div className="rounded-lg border border-black/[0.08] bg-white px-3 py-3 text-sm">
            <p className="font-medium text-black/80">Revise suas competências</p>
            <p className="mt-1 text-xs text-graphite">
              A IA identificou estas competências no seu currículo.{" "}
              <strong>Desmarque as que você não domina</strong> — só as marcadas
              entram no seu perfil.
            </p>
            <div className="mt-3 space-y-1.5">
              {analysis.skills.map((s) => (
                <label
                  key={s.name}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-black/[0.03]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.name)}
                    onChange={() => toggleSkill(s.name)}
                    className="mt-0.5 h-4 w-4 accent-notion-blue"
                  />
                  <span>
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-xs text-stone">{s.category}</span>
                    {s.evidence ? (
                      <span className="mt-0.5 block text-xs text-stone">
                        “{s.evidence}”
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
              {analysis.skills.length === 0 ? (
                <p className="text-xs text-graphite">
                  Nenhuma competência reconhecida automaticamente. Você poderá
                  adicioná-las no seu perfil.
                </p>
              ) : null}
            </div>
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

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={role === "CANDIDATE" ? "Nome completo" : "Nome do responsável"} required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={role === "CANDIDATE" ? "Maria Souza" : "Ana Ribeiro"}
          required
          minLength={2}
        />
      </Field>
      {role === "COMPANY" ? (
        <Field label="Nome da empresa" required>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="TechNova Sistemas"
            required
          />
        </Field>
      ) : null}
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
      {role === "CANDIDATE" ? (
        <Field label="Telefone" required>
          <Input
            value={phone}
            onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            placeholder="(47) 99999-0000"
            inputMode="tel"
            required
          />
        </Field>
      ) : null}
      <Field label="Senha" hint="Use uma senha forte para proteger sua conta." required>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {passwordChecks.map((c) => (
            <li
              key={c.id}
              className={`flex items-center gap-1.5 text-xs ${
                c.ok ? "text-[#1f7a4d]" : "text-stone"
              }`}
            >
              <span aria-hidden>{c.ok ? "✓" : "○"}</span>
              {c.label}
            </li>
          ))}
        </ul>
      </Field>
      <Field label="Confirmar senha" required>
        <Input
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />
      </Field>

      {role === "CANDIDATE" ? (
        <Field
          label="Currículo"
          hint="PDF ou DOCX, até 8 MB. A IA analisa seu currículo assim que a conta é criada — você revisa as competências antes de confirmar."
          required
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-black/[0.15] bg-white/60 px-3 py-2.5">
            <Button
              type="button"
              variant="outlined"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Selecionar arquivo
            </Button>
            <span className="truncate text-sm text-graphite">
              {resume ? resume.name : "Nenhum arquivo selecionado"}
            </span>
          </div>
        </Field>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-[#fde8e4] px-3 py-2 text-sm text-vermillion">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading
          ? role === "CANDIDATE"
            ? "Criando conta e analisando currículo..."
            : "Criando conta..."
          : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-graphite">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-notion-blue hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
