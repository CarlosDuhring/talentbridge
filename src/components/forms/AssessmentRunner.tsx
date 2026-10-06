"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { CodeEditor } from "@/components/forms/CodeEditor";

export type RunnerItem = {
  id: string;
  type: string;
  prompt: string;
  options: string[] | null;
  starterCode: string | null;
  language: string | null;
  skillName: string;
};

export function AssessmentRunner({
  assessmentId,
  items,
}: {
  assessmentId: string;
  items: RunnerItem[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const item = items[index];
  const answer = answers[item.id] ?? (item.type === "CODE" ? item.starterCode ?? "" : "");
  const answered = items.filter((i) => (answers[i.id] ?? "").trim().length > 0).length;

  function setAnswer(value: string) {
    setAnswers((a) => ({ ...a, [item.id]: value }));
  }

  async function runCode() {
    if (!item.language) return;
    setRunning(true);
    setRunOutput(null);
    const res = await fetch("/api/candidate/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: item.language, code: answer }),
    });
    const data = await res.json();
    setRunning(false);
    const out = data.stdout?.trim();
    const err = data.stderr?.trim();
    setRunOutput(
      data.timedOut
        ? "Tempo limite excedido (5s)."
        : out || err || "(sem saída)"
    );
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    const payload = items.map((i) => ({
      itemId: i.id,
      answer: answers[i.id] ?? (i.type === "CODE" ? i.starterCode ?? "" : ""),
    }));
    const res = await fetch(`/api/candidate/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao enviar respostas.");
      return;
    }
    router.push(data.redirect);
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <div className="rounded-xl border border-black/[0.08] bg-white">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <Badge tone="blue">{item.skillName}</Badge>
            <Badge tone="neutral">
              {item.type === "MULTIPLE_CHOICE"
                ? "Múltipla escolha"
                : item.type === "OPEN"
                  ? "Resposta aberta"
                  : `Código · ${item.language}`}
            </Badge>
          </div>
          <span className="text-sm tabular-nums text-stone">
            {index + 1} / {items.length}
          </span>
        </div>

        <div className="px-6 py-5">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {item.prompt}
          </p>

          <div className="mt-5">
            {item.type === "MULTIPLE_CHOICE" && item.options ? (
              <div className="space-y-2">
                {item.options.map((opt, i) => {
                  const selected = answer === String(i);
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(String(i))}
                      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-notion-blue bg-sky-tint/60"
                          : "border-black/[0.08] hover:border-black/20"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                          selected
                            ? "border-notion-blue bg-notion-blue text-white"
                            : "border-black/20 text-black/50"
                        }`}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {item.type === "OPEN" ? (
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={8}
                placeholder="Escreva sua resposta com um exemplo concreto de aplicação."
              />
            ) : null}

            {item.type === "CODE" ? (
              <div className="space-y-3">
                <CodeEditor
                  value={answer}
                  language={item.language ?? "javascript"}
                  onChange={setAnswer}
                />
                <div className="flex items-center gap-3">
                  <Button variant="outlined" size="sm" onClick={runCode} disabled={running}>
                    {running ? "Executando..." : "Executar código"}
                  </Button>
                  <span className="text-xs text-stone">
                    Executa sem entrada de dados (stdin vazio).
                  </span>
                </div>
                {runOutput !== null ? (
                  <pre className="max-h-40 overflow-auto rounded-lg bg-midnight-ink px-4 py-3 text-xs text-white/90">
                    {runOutput}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/[0.06] px-6 py-4">
          <Button
            variant="text"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            ← Anterior
          </Button>
          {index < items.length - 1 ? (
            <Button onClick={() => setIndex((i) => i + 1)}>Próxima →</Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Corrigindo..." : "Enviar avaliação"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-black/[0.08] bg-white p-4">
          <p className="text-[13px] font-medium text-black/80">Progresso</p>
          <p className="mt-1 text-sm text-graphite">
            {answered} de {items.length} respondidas
          </p>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {items.map((i, idx) => {
              const done = (answers[i.id] ?? "").trim().length > 0;
              return (
                <button
                  key={i.id}
                  onClick={() => setIndex(idx)}
                  className={`flex h-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    idx === index
                      ? "bg-notion-blue text-white"
                      : done
                        ? "bg-[#e3f5e9] text-[#1a7f45]"
                        : "bg-black/[0.05] text-black/50"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-black/[0.08] bg-white p-4 text-xs text-graphite">
          <p className="font-medium text-black/80">Como funciona a correção</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>10 questões de múltipla escolha.</li>
            <li>Correção automática: 10 pontos por acerto.</li>
            <li>Pontuação final de 0 a 100.</li>
          </ul>
        </div>

        {error ? (
          <p className="rounded-lg bg-[#fde8e4] px-3 py-2 text-sm text-vermillion">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
