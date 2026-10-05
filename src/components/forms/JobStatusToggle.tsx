"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function JobStatusToggle({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/company/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "OPEN" ? "CLOSED" : "OPEN" }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Erro ao atualizar a vaga.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outlined" onClick={toggle} disabled={loading}>
        {loading
          ? "Atualizando..."
          : status === "OPEN"
            ? "Fechar vaga"
            : "Reabrir vaga"}
      </Button>
      {error ? <span className="text-xs text-vermillion">{error}</span> : null}
    </div>
  );
}
