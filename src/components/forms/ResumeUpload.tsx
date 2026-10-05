"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

type Skill = { name: string; category: string; evidence: string };

type Analysis = {
  summary: string;
  skills: Skill[];
  experiences: { role: string; company: string }[];
  education: { course: string; institution: string }[];
  certifications: { name: string }[];
  projects: { name: string }[];
};

const LOADING_STEPS = [
  "Lendo o arquivo",
  "Identificando competências com IA",
  "Preparando a revisão",
];

export function ResumeUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleSkill(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setSaved(false);
  }

  async function upload(file: File) {
    setLoading(true);
    setLoadingStep(0);
    setError("");
    setAnalysis(null);
    setSaved(false);
    const timer = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 1200);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/candidate/resume", {
      method: "POST",
      body: formData,
    });
    clearInterval(timer);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao analisar o currículo.");
      return;
    }
    const result: Analysis = data.analysis;
    setAnalysis(result);
    setSelected(new Set(result.skills.map((s) => s.name)));
    router.refresh();
  }

  async function confirmSkills() {
    if (!analysis) return;
    setSaving(true);
    setError("");
    const skills = analysis.skills.filter((s) => selected.has(s.name));
    const res = await fetch("/api/candidate/resume/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar competências.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <LoadingOverlay
          title="Analisando seu currículo"
          steps={LOADING_STEPS}
          activeStep={loadingStep}
        />
      ) : null}

      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/[0.15] bg-white/60 px-6 py-10 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
      >
        <p className="text-[15px] font-medium">
          Arraste seu currículo aqui ou selecione um arquivo
        </p>
        <p className="mt-1 text-sm text-graphite">PDF ou DOCX, até 8 MB.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <Button
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Analisando com IA..." : "Selecionar arquivo"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-lg bg-[#fde8e4] px-3 py-2 text-sm text-vermillion">
          {error}
        </p>
      ) : null}

      {analysis ? (
        <div className="animate-fade-up rounded-xl border border-black/[0.08] bg-white p-5">
          <h3 className="text-[17px] font-semibold">Análise do currículo</h3>
          <p className="mt-2 text-sm text-graphite">{analysis.summary}</p>

          <div className="mt-4">
            <p className="text-[13px] font-medium text-black/80">
              Revise as competências identificadas ({analysis.skills.length})
            </p>
            <p className="mt-1 text-xs text-graphite">
              Desmarque o que você não domina. Só as marcadas entram no seu
              perfil como <strong>informadas</strong>.
            </p>
            <div className="mt-2 space-y-1">
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
                    <span className="text-sm font-medium">{s.name}</span>
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
                  Nenhuma competência reconhecida automaticamente. Cadastre-as
                  manualmente no seu perfil.
                </p>
              ) : null}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={confirmSkills} disabled={saving || saved}>
                {saving
                  ? "Salvando..."
                  : saved
                    ? "Competências salvas"
                    : `Salvar ${selected.size} competência(s)`}
              </Button>
              {saved ? (
                <span className="text-sm text-[#1a7f45]">
                  Perfil atualizado.
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              {analysis.experiences.length > 0 ? (
                <div>
                  <p className="text-[13px] font-medium text-black/80">
                    Experiências detectadas
                  </p>
                  <ul className="mt-1 list-inside list-disc text-graphite">
                    {analysis.experiences.slice(0, 4).map((e, i) => (
                      <li key={i}>
                        {e.role} — {e.company}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {analysis.education.length > 0 ? (
                <div>
                  <p className="text-[13px] font-medium text-black/80">Formação</p>
                  <ul className="mt-1 list-inside list-disc text-graphite">
                    {analysis.education.slice(0, 3).map((e, i) => (
                      <li key={i}>{e.course}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          <p className="mt-4 rounded-lg bg-sky-tint/60 px-3 py-2 text-xs text-graphite">
            As competências confirmadas entram no seu perfil como{" "}
            <strong>informadas</strong>. Elas só se tornam{" "}
            <strong>comprovadas</strong> após uma avaliação.
          </p>
        </div>
      ) : null}
    </div>
  );
}
