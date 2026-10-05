"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

type Requirement = {
  skill: string;
  kind: "MANDATORY" | "DESIRABLE";
  minScore: number;
};

type Analysis = {
  level: string;
  summary: string;
  technologies: string[];
  mandatory: { skill: string; minScore: number }[];
  desirable: { skill: string; minScore: number }[];
  minExperienceYears: number;
  minOverallScore: number;
};

export function JobForm() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "review">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    level: "",
    location: "",
    minExperienceYears: 0,
    minOverallScore: 70,
  });
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/company/jobs/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, description: form.description }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao analisar a vaga.");
      return;
    }
    const a = data.analysis as Analysis;
    setAnalysis(a);
    setRequirements([
      ...a.mandatory.map((m) => ({
        skill: m.skill,
        kind: "MANDATORY" as const,
        minScore: m.minScore,
      })),
      ...a.desirable.map((d) => ({
        skill: d.skill,
        kind: "DESIRABLE" as const,
        minScore: d.minScore,
      })),
    ]);
    setForm((f) => ({
      ...f,
      level: f.level || a.level,
      minExperienceYears: a.minExperienceYears,
      minOverallScore: a.minOverallScore,
    }));
    setStep("review");
  }

  function updateReq(index: number, patch: Partial<Requirement>) {
    setRequirements((reqs) =>
      reqs.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  }

  function removeReq(index: number) {
    setRequirements((reqs) => reqs.filter((_, i) => i !== index));
  }

  function addReq() {
    setRequirements((reqs) => [
      ...reqs,
      { skill: "", kind: "MANDATORY", minScore: 70 },
    ]);
  }

  async function publish() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/company/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        requirements: requirements.filter((r) => r.skill.trim()),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao publicar a vaga.");
      return;
    }
    router.push(`/empresa/vagas/${data.jobId}`);
    router.refresh();
  }

  if (step === "form") {
    return (
      <form onSubmit={analyze} className="space-y-5">
        <Field label="Título da vaga" required>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Desenvolvedor PHP Júnior"
            required
            minLength={2}
          />
        </Field>
        <Field
          label="Descrição da vaga"
          hint="Inclua responsabilidades, requisitos obrigatórios, desejáveis e tempo de experiência. A IA extrai os critérios automaticamente."
          required
        >
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={10}
            placeholder="Buscamos profissional com experiência em PHP e MySQL..."
            required
            minLength={20}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nível">
            <Select value={form.level} onChange={(e) => set("level", e.target.value)}>
              <option value="">Detectar automaticamente</option>
              <option value="Júnior">Júnior</option>
              <option value="Pleno">Pleno</option>
              <option value="Sênior">Sênior</option>
            </Select>
          </Field>
          <Field label="Localização">
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Joinville, SC (híbrido)"
            />
          </Field>
          <Field label="Experiência mínima (anos)">
            <Input
              type="number"
              min={0}
              max={30}
              value={form.minExperienceYears}
              onChange={(e) => set("minExperienceYears", Number(e.target.value))}
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-vermillion">{error}</p> : null}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Analisando com IA..." : "Analisar vaga com IA"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      {analysis ? (
        <div className="rounded-xl border border-black/[0.08] bg-sky-tint/40 p-5">
          <div className="flex items-center gap-2">
            <Badge tone="blue">Análise da IA</Badge>
            <Badge tone="neutral">Nível {analysis.level}</Badge>
          </div>
          <p className="mt-2 text-sm text-graphite">{analysis.summary}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-black/[0.08] bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold">Critérios de elegibilidade</h3>
          <Button variant="outlined" size="sm" onClick={addReq}>
            + Critério
          </Button>
        </div>
        <p className="mt-1 text-sm text-graphite">
          Revise os critérios extraídos. Somente critérios técnicos são permitidos.
        </p>
        <div className="mt-4 space-y-3">
          {requirements.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <Input
                value={r.skill}
                onChange={(e) => updateReq(i, { skill: e.target.value })}
                placeholder="Competência"
                className="max-w-[220px]"
              />
              <Select
                value={r.kind}
                onChange={(e) =>
                  updateReq(i, { kind: e.target.value as Requirement["kind"] })
                }
                className="max-w-[160px]"
              >
                <option value="MANDATORY">Obrigatória</option>
                <option value="DESIRABLE">Desejável</option>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone">mín.</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={r.minScore}
                  onChange={(e) =>
                    updateReq(i, { minScore: Number(e.target.value) })
                  }
                  className="w-20"
                />
              </div>
              <button
                onClick={() => removeReq(i)}
                className="text-xs text-vermillion hover:underline"
              >
                Remover
              </button>
            </div>
          ))}
          {requirements.length === 0 ? (
            <p className="text-sm text-graphite">
              Nenhum critério. Adicione ao menos uma competência obrigatória.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Nível">
          <Select value={form.level} onChange={(e) => set("level", e.target.value)}>
            <option value="Júnior">Júnior</option>
            <option value="Pleno">Pleno</option>
            <option value="Sênior">Sênior</option>
          </Select>
        </Field>
        <Field label="Experiência mínima (anos)">
          <Input
            type="number"
            min={0}
            max={30}
            value={form.minExperienceYears}
            onChange={(e) => set("minExperienceYears", Number(e.target.value))}
          />
        </Field>
        <Field label="Pontuação geral mínima">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.minOverallScore}
            onChange={(e) => set("minOverallScore", Number(e.target.value))}
          />
        </Field>
      </div>

      {error ? <p className="text-sm text-vermillion">{error}</p> : null}
      <div className="flex gap-3">
        <Button onClick={publish} size="lg" disabled={loading}>
          {loading ? "Publicando..." : "Publicar vaga"}
        </Button>
        <Button variant="text" onClick={() => setStep("form")}>
          ← Voltar e editar descrição
        </Button>
      </div>
    </div>
  );
}
