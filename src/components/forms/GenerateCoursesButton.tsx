"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function GenerateCoursesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/candidate/courses", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao gerar recomendações.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button onClick={generate} disabled={loading}>
        {loading ? "Analisando lacunas..." : "Gerar recomendações"}
      </Button>
      {error ? <p className="text-xs text-vermillion">{error}</p> : null}
    </div>
  );
}
