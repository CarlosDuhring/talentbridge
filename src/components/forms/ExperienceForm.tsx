"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

export function ExperienceForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company: "",
    role: "",
    startDate: "",
    endDate: "",
    current: false,
    registered: false,
    description: "",
    technologies: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/candidate/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar experiência.");
      return;
    }
    setForm({
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      current: false,
      registered: false,
      description: "",
      technologies: "",
    });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outlined">
        + Adicionar experiência
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-black/[0.08] bg-white p-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Empresa" required>
          <Input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            required
          />
        </Field>
        <Field label="Cargo" required>
          <Input
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            required
          />
        </Field>
        <Field label="Início" required>
          <Input
            type="month"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            required
          />
        </Field>
        <Field label="Fim">
          <Input
            type="month"
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            disabled={form.current}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.current}
          onChange={(e) => set("current", e.target.checked)}
          className="h-4 w-4 rounded border-black/20"
        />
        Trabalho aqui atualmente
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.registered}
          onChange={(e) => set("registered", e.target.checked)}
          className="h-4 w-4 rounded border-black/20"
        />
        Experiência registrada em carteira de trabalho
      </label>
      <Field label="Atividades" hint="Descreva responsabilidades e resultados.">
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
        />
      </Field>
      <Field
        label="Tecnologias utilizadas"
        hint="Separe por vírgula. Elas viram competências informadas no seu perfil."
      >
        <Input
          value={form.technologies}
          onChange={(e) => set("technologies", e.target.value)}
          placeholder="PHP, MySQL, Git"
        />
      </Field>
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

export function DeleteButton({
  endpoint,
  id,
  label = "Excluir",
}: {
  endpoint: string;
  id: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    setLoading(true);
    await fetch(`${endpoint}?id=${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-xs text-vermillion hover:underline disabled:opacity-50"
    >
      {loading ? "Excluindo..." : label}
    </button>
  );
}
