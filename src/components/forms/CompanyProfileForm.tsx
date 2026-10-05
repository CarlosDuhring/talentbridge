"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

type CompanyData = {
  tradeName: string;
  sector: string;
  location: string;
  website: string;
  description: string;
};

export function CompanyProfileForm({ initial }: { initial: CompanyData }) {
  const router = useRouter();
  const [data, setData] = useState<CompanyData>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function set<K extends keyof CompanyData>(key: K, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    setStatus("idle");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const res = await fetch("/api/company/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setStatus("saved");
      router.refresh();
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Nome da empresa" required>
        <Input
          value={data.tradeName}
          onChange={(e) => set("tradeName", e.target.value)}
          required
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Setor">
          <Input
            value={data.sector}
            onChange={(e) => set("sector", e.target.value)}
            placeholder="Tecnologia"
          />
        </Field>
        <Field label="Localização">
          <Input
            value={data.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Joinville, SC"
          />
        </Field>
      </div>
      <Field label="Site">
        <Input
          value={data.website}
          onChange={(e) => set("website", e.target.value)}
          placeholder="https://empresa.com.br"
        />
      </Field>
      <Field label="Descrição">
        <Textarea
          value={data.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="Conte um pouco sobre a empresa e a cultura."
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Salvando..." : "Salvar alterações"}
        </Button>
        {status === "saved" ? (
          <span className="text-sm text-[#1a7f45]">Perfil atualizado.</span>
        ) : null}
        {status === "error" ? (
          <span className="text-sm text-vermillion">Erro ao salvar.</span>
        ) : null}
      </div>
    </form>
  );
}
