"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function SkipAssessmentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function skip() {
    setLoading(true);
    await fetch("/api/candidate/boas-vindas/pular", { method: "POST" });
    router.push("/candidato");
    router.refresh();
  }

  return (
    <Button variant="text" onClick={skip} disabled={loading}>
      {loading ? "Saindo..." : "Agora não, quero fazer depois"}
    </Button>
  );
}
