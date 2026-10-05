export const SKILL_ORIGIN_LABELS: Record<string, string> = {
  CURRICULO: "Currículo",
  EXPERIENCIA: "Experiência",
  PROJETO: "Projeto",
  MANUAL: "Manual",
  TESTE: "Teste",
};

export function originLabel(origin?: string | null): string | null {
  if (!origin) return null;
  return SKILL_ORIGIN_LABELS[origin] ?? origin;
}

export type OriginTone = "neutral" | "blue" | "green" | "yellow" | "red" | "purple" | "sky";

export function originTone(origin?: string | null): OriginTone {
  switch (origin) {
    case "CURRICULO":
      return "blue";
    case "EXPERIENCIA":
      return "purple";
    case "PROJETO":
      return "sky";
    case "TESTE":
      return "green";
    default:
      return "neutral";
  }
}
