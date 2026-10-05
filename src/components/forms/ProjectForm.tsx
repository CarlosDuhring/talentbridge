"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

export function ProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    technologies: "",
    url: "",
    repo: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/candidate/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar projeto.");
      return;
    }
    setForm({ name: "", description: "", technologies: "", url: "", repo: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outlined">
        + Adicionar projeto
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-black/[0.08] bg-white p-5"
    >
      <Field label="Nome do projeto" required>
        <Input
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Sistema de gestão de estoque"
          required
        />
      </Field>
      <Field label="Descrição">
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="O que o projeto faz, qual problema resolve e qual foi seu papel."
        />
      </Field>
      <Field
        label="Tecnologias"
        hint="Separe por vírgula. Elas viram competências informadas."
      >
        <Input
          value={form.technologies}
          onChange={(e) => set("technologies", e.target.value)}
          placeholder="React, Node.js, PostgreSQL"
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Link do projeto">
          <Input
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://..."
          />
        </Field>
        <Field label="Repositório">
          <Input
            value={form.repo}
            onChange={(e) => set("repo", e.target.value)}
            placeholder="https://github.com/..."
          />
        </Field>
      </div>
      {error ? <p className="text-sm text-vermillion">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="text" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
