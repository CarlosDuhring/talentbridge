"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formatPhoneBR } from "@/lib/format";

type ProfileData = {
  phone: string;
  location: string;
  headline: string;
  objective: string;
  github: string;
  portfolio: string;
  linkedin: string;
  workCardNotes: string;
};

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const router = useRouter();
  const [data, setData] = useState<ProfileData>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function set<K extends keyof ProfileData>(key: K, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    setStatus("idle");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const res = await fetch("/api/candidate/profile", {
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
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Telefone">
          <Input
            value={data.phone}
            onChange={(e) => set("phone", formatPhoneBR(e.target.value))}
            placeholder="(47) 99999-0000"
            inputMode="tel"
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
      <Field label="Título profissional" hint="Ex.: Desenvolvedor PHP Júnior">
        <Input
          value={data.headline}
          onChange={(e) => set("headline", e.target.value)}
          placeholder="Desenvolvedor PHP Júnior"
        />
      </Field>
      <Field label="Objetivo profissional">
        <Textarea
          value={data.objective}
          onChange={(e) => set("objective", e.target.value)}
          rows={3}
          placeholder="Descreva o tipo de oportunidade que você busca."
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="GitHub">
          <Input
            value={data.github}
            onChange={(e) => set("github", e.target.value)}
            placeholder="github.com/usuario"
          />
        </Field>
        <Field label="Portfólio">
          <Input
            value={data.portfolio}
            onChange={(e) => set("portfolio", e.target.value)}
            placeholder="seusite.dev"
          />
        </Field>
        <Field label="LinkedIn">
          <Input
            value={data.linkedin}
            onChange={(e) => set("linkedin", e.target.value)}
            placeholder="linkedin.com/in/usuario"
          />
        </Field>
      </div>
      <Field
        label="Observações sobre disponibilidade"
        hint="Ex.: disponibilidade para estágio, carga horária, modelo de trabalho."
      >
        <Textarea
          value={data.workCardNotes}
          onChange={(e) => set("workCardNotes", e.target.value)}
          rows={2}
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
