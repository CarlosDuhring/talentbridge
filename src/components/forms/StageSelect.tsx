"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Field";

const STAGES: { value: string; label: string }[] = [
  { value: "ELIGIBLE", label: "Elegível" },
  { value: "IN_REVIEW", label: "Em análise" },
  { value: "INTERVIEW", label: "Entrevista" },
  { value: "SELECTED", label: "Selecionado" },
  { value: "HIRED", label: "Contratado" },
  { value: "REJECTED", label: "Não selecionado" },
];

export function StageSelect({
  jobId,
  candidateId,
  stage,
}: {
  jobId: string;
  candidateId: string;
  stage: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(stage);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    setValue(next);
    setSaving(true);
    await fetch(`/api/company/jobs/${jobId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, stage: next }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        onChange={(e) => change(e.target.value)}
        className="max-w-[170px]"
        disabled={saving}
      >
        {STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      {saving ? <span className="text-xs text-stone">Salvando...</span> : null}
    </div>
  );
}
