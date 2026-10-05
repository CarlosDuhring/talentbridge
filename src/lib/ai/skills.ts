import type { SkillCategory } from "./types";

type SkillDef = {
  name: string;
  category: SkillCategory;
  aliases: string[];
};

export const SKILL_DICTIONARY: SkillDef[] = [
  { name: "PHP", category: "LINGUAGEM", aliases: ["php"] },
  { name: "JavaScript", category: "LINGUAGEM", aliases: ["javascript", "js", "ecmascript"] },
  { name: "TypeScript", category: "LINGUAGEM", aliases: ["typescript", "ts"] },
  { name: "Python", category: "LINGUAGEM", aliases: ["python"] },
  { name: "Java", category: "LINGUAGEM", aliases: ["java "] },
  { name: "C#", category: "LINGUAGEM", aliases: ["c#", "csharp", ".net"] },
  { name: "Go", category: "LINGUAGEM", aliases: ["golang", " go "] },
  { name: "Ruby", category: "LINGUAGEM", aliases: ["ruby"] },
  { name: "SQL", category: "BANCO_DE_DADOS", aliases: ["sql"] },
  { name: "MySQL", category: "BANCO_DE_DADOS", aliases: ["mysql"] },
  { name: "PostgreSQL", category: "BANCO_DE_DADOS", aliases: ["postgresql", "postgres"] },
  { name: "MongoDB", category: "BANCO_DE_DADOS", aliases: ["mongodb", "mongo"] },
  { name: "Redis", category: "BANCO_DE_DADOS", aliases: ["redis"] },
  { name: "Laravel", category: "FRAMEWORK", aliases: ["laravel"] },
  { name: "React", category: "FRAMEWORK", aliases: ["react"] },
  { name: "Next.js", category: "FRAMEWORK", aliases: ["next.js", "nextjs", "next js"] },
  { name: "Vue.js", category: "FRAMEWORK", aliases: ["vue"] },
  { name: "Angular", category: "FRAMEWORK", aliases: ["angular"] },
  { name: "Node.js", category: "FRAMEWORK", aliases: ["node.js", "nodejs", "node js"] },
  { name: "Django", category: "FRAMEWORK", aliases: ["django"] },
  { name: "Spring Boot", category: "FRAMEWORK", aliases: ["spring"] },
  { name: "Bootstrap", category: "FRAMEWORK", aliases: ["bootstrap"] },
  { name: "Tailwind CSS", category: "FRAMEWORK", aliases: ["tailwind"] },
  { name: "Git", category: "FERRAMENTA", aliases: ["git", "github", "gitlab"] },
  { name: "Docker", category: "FERRAMENTA", aliases: ["docker"] },
  { name: "Kubernetes", category: "FERRAMENTA", aliases: ["kubernetes", "k8s"] },
  { name: "AWS", category: "FERRAMENTA", aliases: ["aws", "amazon web services"] },
  { name: "Linux", category: "FERRAMENTA", aliases: ["linux"] },
  { name: "REST APIs", category: "FUNDAMENTO", aliases: ["rest", "api rest", "restful"] },
  { name: "Lógica de programação", category: "FUNDAMENTO", aliases: ["lógica", "logica de programacao", "algoritmos", "algoritmo"] },
  { name: "Estruturas de dados", category: "FUNDAMENTO", aliases: ["estrutura de dados", "estruturas de dados"] },
  { name: "POO", category: "FUNDAMENTO", aliases: ["orientação a objetos", "orientacao a objetos", "poo", "oop"] },
  { name: "Testes automatizados", category: "FUNDAMENTO", aliases: ["testes automatizados", "phpunit", "jest", "pytest", "junit", "tdd"] },
  { name: "HTML", category: "FUNDAMENTO", aliases: ["html"] },
  { name: "CSS", category: "FUNDAMENTO", aliases: ["css"] },
  { name: "Scrum", category: "OUTRO", aliases: ["scrum", "ágil", "agile", "kanban"] },
  { name: "Comunicação", category: "SOFT_SKILL", aliases: ["comunicação", "comunicacao", "comunicativo", "comunicação clara"] },
  { name: "Trabalho em equipe", category: "SOFT_SKILL", aliases: ["trabalho em equipe", "trabalho em time", "teamwork", "colaboração", "colaboracao"] },
  { name: "Liderança", category: "SOFT_SKILL", aliases: ["liderança", "lideranca", "liderar", "liderou"] },
  { name: "Resolução de problemas", category: "SOFT_SKILL", aliases: ["resolução de problemas", "resolucao de problemas", "solução de problemas", "solucao de problemas", "problem solving"] },
  { name: "Proatividade", category: "SOFT_SKILL", aliases: ["proatividade", "proativo", "proativa", "iniciativa"] },
  { name: "Organização", category: "SOFT_SKILL", aliases: ["organização", "organizacao", "organizado", "organizada"] },
  { name: "Gestão de tempo", category: "SOFT_SKILL", aliases: ["gestão de tempo", "gestao de tempo", "gestão do tempo", "priorização", "priorizacao", "prazos"] },
  { name: "Adaptabilidade", category: "SOFT_SKILL", aliases: ["adaptabilidade", "adaptável", "adaptavel", "flexibilidade", "resiliência", "resiliencia"] },
  { name: "Pensamento crítico", category: "SOFT_SKILL", aliases: ["pensamento crítico", "pensamento critico", "análise crítica", "analise critica"] },
  { name: "Inteligência emocional", category: "SOFT_SKILL", aliases: ["inteligência emocional", "inteligencia emocional", "empatia", "empático", "empatico"] },
  { name: "Criatividade", category: "SOFT_SKILL", aliases: ["criatividade", "criativo", "criativa"] },
];

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectSkills(text: string): { name: string; category: SkillCategory; evidence: string }[] {
  const norm = normalize(text);
  const found: { name: string; category: SkillCategory; evidence: string }[] = [];
  for (const def of SKILL_DICTIONARY) {
    for (const alias of def.aliases) {
      const a = normalize(alias).trim();
      if (!a) continue;
      const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
      const m = re.exec(norm);
      if (m) {
        const idx = m.index + m[1].length;
        const start = Math.max(0, idx - 40);
        const end = Math.min(text.length, idx + a.length + 40);
        found.push({
          name: def.name,
          category: def.category,
          evidence: text.slice(start, end).replace(/\s+/g, " ").trim(),
        });
        break;
      }
    }
  }
  return found;
}

type ResumeSection = "SKILLS" | "EXPERIENCE" | "PROJECTS" | "COURSES" | "OTHER";

const SECTION_HEADERS: { section: ResumeSection; re: RegExp }[] = [
  {
    section: "SKILLS",
    re: /^(habilidades|compet[êe]ncias|conhecimentos|tecnologias|skills|stack|ferramentas)\b/i,
  },
  {
    section: "EXPERIENCE",
    re: /^(experi[êe]ncia|experi[êe]ncias|hist[óo]rico profissional|atua[çc][ãa]o profissional)\b/i,
  },
  { section: "PROJECTS", re: /^(projetos|portf[óo]lio)\b/i },
  {
    section: "COURSES",
    re: /^(cursos?|capacita[çc][õo]es|treinamentos?|certifica[çc][õo]es|certificados?|qualifica[çc][õo]es)\b/i,
  },
  {
    section: "OTHER",
    re: /^(forma[çc][ãa]o|educa[çc][ãa]o|idiomas|objetivo|resumo|sobre|contato|dados pessoais)\b/i,
  },
];

function stripContacts(text: string) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, " ")
    .replace(/https?:\/\/\S+|www\.\S+/gi, " ")
    .replace(/\b[\w-]+\.(com|dev|io|br|net|org|me)(\/\S*)?/gi, " ");
}

export function detectResumeSkills(
  text: string
): { name: string; category: SkillCategory; evidence: string }[] {
  const lines = stripContacts(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const found = new Map<string, { name: string; category: SkillCategory; evidence: string }>();
  let section: ResumeSection | null = null;

  const scan = (line: string) => {
    for (const s of detectSkills(line)) {
      if (!found.has(s.name)) found.set(s.name, s);
    }
  };

  for (const line of lines) {
    let isHeader = false;
    for (const h of SECTION_HEADERS) {
      const m = line.match(h.re);
      if (!m) continue;
      isHeader = true;
      section = h.section;
      const rest = line.slice(m[0].length).replace(/^[ \t]*:?[ \t]*/, "");
      if (rest && section !== "OTHER") scan(rest);
      break;
    }
    if (isHeader) continue;
    if (section && section !== "OTHER") {
      scan(line);
    }
  }

  if (found.size === 0) {
    for (const line of lines) {
      const hits = detectSkills(line);
      if (hits.length >= 2) {
        for (const s of hits) if (!found.has(s.name)) found.set(s.name, s);
      }
    }
  }

  return [...found.values()];
}

export function skillCategory(name: string): SkillCategory {
  const def = SKILL_DICTIONARY.find((d) => d.name === name);
  return def?.category ?? "OUTRO";
}
