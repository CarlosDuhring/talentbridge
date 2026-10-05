"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function GenerateAssessmentButton({
  hasSkills,
  label = "Gerar nova avaliação",
}: {
  hasSkills: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/candidate/assessments", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao gerar avaliação.");
      return;
    }
    router.push(`/candidato/avaliacoes/${data.assessmentId}`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={generate} disabled={loading || !hasSkills}>
        {loading ? "Gerando com IA..." : label}
      </Button>
      {!hasSkills ? (
        <p className="text-xs text-stone">
          Envie o currículo ou cadastre experiências primeiro.
        </p>
      ) : null}
      {error ? <p className="text-xs text-vermillion">{error}</p> : null}
    </div>
  );
}
