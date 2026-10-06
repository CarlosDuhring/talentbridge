"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type SkillOption = {
  name: string;
  category: string;
  source: string;
  score: number | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  LINGUAGEM: "Linguagem",
  FRAMEWORK: "Framework",
  BANCO_DE_DADOS: "Banco de dados",
  FERRAMENTA: "Ferramenta",
  FUNDAMENTO: "Fundamento",
  SOFT_SKILL: "Soft skill",
  IDIOMA: "Idioma",
  OUTRO: "Outro",
};

const CATEGORY_ORDER = [
  "LINGUAGEM",
  "FRAMEWORK",
  "BANCO_DE_DADOS",
  "FERRAMENTA",
  "FUNDAMENTO",
  "IDIOMA",
  "SOFT_SKILL",
  "OUTRO",
];

export function AssessmentSkillPicker() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/candidate/assessments")
      .then((r) => r.json())
      .then((d) => {
        if (active) setSkills(d.skills ?? []);
      })
      .catch(() => {
        if (active) setSkills([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = (skills ?? []).filter(
      (s) => !q || s.name.toLowerCase().includes(q)
    );
    const map = new Map<string, SkillOption[]>();
    for (const s of filtered) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [skills, query]);

  async function start() {
    if (!selected) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/candidate/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: selected, questionCount: 10 }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao gerar avaliação.");
      return;
    }
    router.push(`/candidato/avaliacoes/${data.assessmentId}`);
    router.refresh();
  }

  if (skills === null) {
    return (
      <div className="rounded-xl border border-black/[0.08] bg-white p-6 text-sm text-graphite">
        Carregando competências...
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="rounded-xl border border-black/[0.08] bg-white p-6">
        <p className="text-sm text-graphite">
          Nenhuma competência identificada ainda. Envie seu currículo ou cadastre
          experiências e projetos antes de gerar a avaliação.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white">
      <div className="border-b border-black/[0.06] px-6 py-4">
        <h3 className="text-[17px] font-semibold tracking-[-0.01em]">
          Escolha uma competência para avaliar
        </h3>
        <p className="mt-0.5 text-sm text-graphite">
          Você responde 10 questões e recebe uma pontuação de 0 a 100.
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar competência..."
          className="mt-3 w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2 text-sm placeholder:text-black/35 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-notion-blue/15"
        />
      </div>

      <div className="max-h-[420px] space-y-5 overflow-y-auto px-6 py-5">
        {grouped.length === 0 ? (
          <p className="text-sm text-graphite">Nenhuma competência encontrada.</p>
        ) : (
          grouped.map((group) => (
            <div key={group.category}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">
                {CATEGORY_LABEL[group.category] ?? group.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((s) => {
                  const active = selected === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => setSelected(s.name)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border-notion-blue bg-sky-tint/60 text-black"
                          : "border-black/[0.08] hover:border-black/25"
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      {s.score !== null ? (
                        <Badge tone="green" className="px-2 py-0.5 text-[10px]">
                          {Math.round(s.score)}/100
                        </Badge>
                      ) : (
                        <Badge tone="yellow" className="px-2 py-0.5 text-[10px]">
                          não avaliada
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-6 py-4">
        <p className="text-sm text-graphite">
          {selected ? (
            <>
              Competência selecionada:{" "}
              <span className="font-medium text-black">{selected}</span>
            </>
          ) : (
            "Selecione uma competência acima."
          )}
        </p>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={start} disabled={!selected || loading}>
            {loading ? "Gerando 10 questões..." : "Iniciar avaliação"}
          </Button>
          {error ? <p className="text-xs text-vermillion">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
