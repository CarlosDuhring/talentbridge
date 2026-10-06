import type {
  AIProvider,
  AssessmentDraft,
  AssessmentOptions,
  CandidateContext,
  CourseSuggestion,
  GradeResult,
  JobAnalysisData,
  ResumeAnalysisData,
} from "./types";
import { detectResumeSkills, detectSkills, normalize } from "./skills";

const LEVELS = ["Júnior", "Pleno", "Sênior"] as const;

function inferLevel(months: number): string {
  if (months >= 60) return "Sênior";
  if (months >= 24) return "Pleno";
  return "Júnior";
}

function monthsBetween(start: string, end?: string | null): number {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  if (isNaN(s.getTime())) return 0;
  const diff = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return Math.max(0, diff);
}

function shuffleItems<T extends { skill: string }>(items: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.skill) ?? [];
    list.push(item);
    groups.set(item.skill, list);
  }
  const lists = [...groups.values()];
  const mixed: T[] = [];
  let remaining = items.length;
  let depth = 0;
  while (remaining > 0) {
    for (const list of lists) {
      const item = list[depth];
      if (item) {
        mixed.push(item);
        remaining--;
      }
    }
    depth++;
  }
  return mixed;
}

const RESUME_HEADER_WORDS =
  /curr[íi]culo|curriculum|vitae|desenvolvedor|analista|programador|dados pessoais|forma[çc][ãa]o|experi[êe]ncia|habilidades|compet[êe]ncias|projetos|cursos?|certifica|idiomas|objetivo|resumo|sobre|contato|linguagens|web|frontend|backend|banco de dados|cloud|devops|infraestrutura|ciberseguran[çc]a|seguran[çc]a|soft skills|frameworks|bibliotecas|mobile|testes/i;

function extractName(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 5 &&
      words.every((w) => /^[A-ZÀ-Ú][a-zà-ú'.-]+$/.test(w)) &&
      !RESUME_HEADER_WORDS.test(line)
    ) {
      return line;
    }
  }
  return undefined;
}

function extractCertifications(text: string) {
  const out: ResumeAnalysisData["certifications"] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const seen = new Set<string>();

  function push(name: string, issuer?: string, year?: number) {
    const clean = name
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^[-•*]\s*/, "")
      .slice(0, 100);
    if (clean.length < 3) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    if ([...seen].some((k) => k.includes(key) || key.includes(k))) return;
    seen.add(key);
    out.push({ name: clean, issuer: issuer?.trim() || undefined, year });
  }

  for (const line of lines) {
    if (!/certifica/i.test(line)) continue;
    const yearMatch = line.match(/(19|20)\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
    const stripped = line
      .replace(/\(?\s*certifica(?:do|ção|cao|dos|ções|oes)?[^)]*\)?/gi, " ")
      .replace(/^[-•*]\s*/, "")
      .trim();
    const parts = stripped
      .split(/\s+[-–—]\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) continue;
    const name = parts[0];
    const issuer = parts.length > 1 ? parts[parts.length - 1] : undefined;
    push(name, issuer, year);
  }

  return out.slice(0, 8);
}

function extractCourses(text: string) {
  const out: ResumeAnalysisData["courses"] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const isEducation =
    /ensino (fundamental|m[ée]dio)|gradua[çc][ãa]o|bacharelado|licenciatura|t[ée]cnico em|mestrado|p[óo]s-gradua/i;
  const isRole =
    /^(desenvolvedor|programador|analista|engenheiro|estagi[áa]rio|t[ée]cnico|gerente|coordenador|diretor|assistente|consultor|especialista|arquiteto|designer|product|tech lead|est[áa]gio)/i;

  function push(name: string, issuer?: string, year?: number) {
    const clean = name
      .trim()
      .replace(/\s+/g, " ")
      .replace(/^[-•*]\s*/, "")
      .slice(0, 100);
    if (clean.length < 4) return;
    if (/^(cursos?|capacita|treinamentos?)$/i.test(clean)) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    if ([...seen].some((k) => k.includes(key) || key.includes(k))) return;
    seen.add(key);
    out.push({ name: clean, issuer: issuer?.trim() || undefined, year });
  }

  for (const line of lines) {
    if (/certifica/i.test(line)) continue;
    const stripped = line.replace(/^[-•*]\s*/, "").trim();
    if (stripped.length < 5) continue;
    if (isEducation.test(stripped) || isRole.test(stripped)) continue;
    const yearMatch = stripped.match(/(19|20)\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : undefined;
    const parts = stripped
      .split(/\s+[-–—]\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length < 2) continue;
    const name = parts[0];
    const issuer = parts[parts.length - 1];
    if (name.length < 4 || issuer.length < 2 || issuer.length > 60) continue;
    push(name, issuer, year);
  }

  return out.slice(0, 8);
}

function extractEducation(text: string) {
  const out: ResumeAnalysisData["education"] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const re =
    /(t[ée]cnico|tecn[óo]logo|bacharelado|licenciatura|gradua[çc][ãa]o|mestrado|p[óo]s-gradua[çc][ãa]o|ensino m[ée]dio|ensino fundamental)[^\n]{0,100}/i;
  const seen = new Set<string>();

  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const raw = m[0].trim();
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const yearMatch = raw.match(/(19|20)\d{2}/);
    const parts = raw
      .split(/\s+[-–—]\s+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const candidates = parts.filter((p) => !p.startsWith("(") && p.length >= 3);
    let institution = "Instituição identificada no currículo";
    if (candidates.length > 1) {
      institution = candidates[candidates.length - 1];
    } else {
      const stripped = raw
        .replace(
          /^(ensino m[ée]dio|ensino fundamental|t[ée]cnico|tecn[óo]logo|bacharelado|licenciatura|gradua[çc][ãa]o|mestrado|p[óo]s-gradua[çc][ãa]o)\s*(em|com|de)?\s*/i,
          ""
        )
        .trim();
      if (stripped.length >= 3) institution = stripped;
    }
    out.push({
      institution,
      course: raw,
      level: /mestrado|p[óo]s/i.test(raw)
        ? "PÓS-GRADUAÇÃO"
        : /bacharelado|licenciatura|gradua[çc][ãa]o|tecn[óo]logo/i.test(raw)
          ? "GRADUAÇÃO"
          : /t[ée]cnico/i.test(raw)
            ? "TÉCNICO"
            : "ENSINO_MEDIO",
      endYear: yearMatch ? parseInt(yearMatch[0]) : undefined,
    });
  }
  return out.slice(0, 5);
}

function extractExperiences(text: string) {
  const out: ResumeAnalysisData["experiences"] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const startRe =
    /^(experi[êe]ncia|experi[êe]ncias|hist[óo]rico profissional|atua[çc][ãa]o profissional)\b/i;
  const stopRe =
    /^(forma[çc][ãa]o|educa[çc][ãa]o|habilidades|compet[êe]ncias|projetos|portf[óo]lio|cursos?|certifica|idiomas|objetivo|resumo|sobre|contato|dados pessoais)\b/i;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (startRe.test(lines[i])) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) return out;

  const roleRe =
    /(desenvolvedor[a]?|programador[a]?|analista|engenheiro[a]?|estagi[áa]rio[a]?|t[ée]cnico[a]?|gerente|coordenador[a]?|consultor[a]?|especialista|arquiteto[a]?)[^\n]{0,60}/i;
  const seen = new Set<string>();
  for (let i = start; i < lines.length; i++) {
    if (stopRe.test(lines[i])) break;
    const m = lines[i].match(roleRe);
    if (!m) continue;
    const role = m[0].trim().replace(/\s+/g, " ");
    if (seen.has(role.toLowerCase())) continue;
    seen.add(role.toLowerCase());
    const years = lines[i].match(/(\d+)\s*(anos?|ano)/i);
    const months = years ? parseInt(years[1]) * 12 : 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    out.push({
      company: "Empresa identificada no currículo",
      role,
      startDate: startDate.toISOString().slice(0, 10),
      current: /atual|presente/i.test(lines[i]),
      technologies: detectSkills(lines[i]).map((s) => s.name),
    });
  }
  return out.slice(0, 6);
}

const CATEGORY_CONCEPTS: Record<string, string[]> = {
  LINGUAGEM: [
    "tipagem",
    "escopo",
    "estruturas de controle",
    "funções",
    "tratamento de erros",
    "coleções",
  ],
  FRAMEWORK: [
    "arquitetura",
    "ciclo de vida",
    "configuração",
    "componentes",
    "roteamento",
    "boas práticas",
  ],
  BANCO_DE_DADOS: [
    "modelagem",
    "consultas",
    "índices",
    "transações",
    "integridade referencial",
    "otimização",
  ],
  FERRAMENTA: [
    "instalação",
    "configuração",
    "fluxo de trabalho",
    "automação",
    "integração",
  ],
  FUNDAMENTO: [
    "conceitos",
    "aplicação prática",
    "trade-offs",
    "complexidade",
    "resolução de problemas",
  ],
  IDIOMA: [
    "vocabulário técnico",
    "leitura",
    "compreensão",
    "comunicação",
  ],
  SOFT_SKILL: [
    "comunicação",
    "colaboração",
    "organização",
    "resolução de conflitos",
    "empatia",
  ],
  OUTRO: ["conceitos", "aplicação prática", "boas práticas", "fundamentos"],
};

type SkillRef = {
  name: string;
  category: string;
  evidence?: string | null;
  origin?: string | null;
};

type KnowledgeQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rotate<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  const shift = seed % a.length;
  for (let k = 0; k < shift; k++) a.push(a.shift() as T);
  return a;
}

function skillConcepts(skill: SkillRef): string[] {
  return CATEGORY_CONCEPTS[skill.category] ?? CATEGORY_CONCEPTS.OUTRO;
}

function knowledgeQuestions(skill: SkillRef, count: number): KnowledgeQuestion[] {
  const concepts = seededShuffle(
    skillConcepts(skill),
    hashString(`concepts:${skill.name}`)
  );
  const origin = skill.origin?.trim() || "projetos reais";
  const questions: KnowledgeQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const extra = concepts[i % concepts.length];
    const seed = hashString(`${skill.name}:${i}`);
    const correct = `${skill.name} envolve ${extra}, aplicado de forma consistente em ${origin}.`;
    const options = [
      correct,
      `Dominar ${skill.name} não exige ${extra}; basta memorizar a sintaxe básica.`,
      `${skill.name} dispensa ${extra} e se resume a repetir exemplos prontos.`,
      `${extra} é irrelevante para ${skill.name} na prática.`,
    ];
    const rotated = rotate(options, seed);
    questions.push({
      prompt: `Sobre ${skill.name}, qual afirmação está correta?`,
      options: rotated,
      correctIndex: rotated.indexOf(correct),
    });
  }
  return questions;
}

function openItemFor(skill: SkillRef): { prompt: string; rubric: string } {
  const concepts = skillConcepts(skill).slice(0, 4).join(", ");
  const evidence = skill.evidence?.trim();
  const ref = evidence ? `No seu currículo consta: "${evidence}". ` : "";
  if (skill.category === "SOFT_SKILL") {
    return {
      prompt: `${ref}Descreva uma situação real em que você demonstrou ${skill.name}: qual era o contexto, o que você fez e qual foi o resultado?`,
      rubric: `Conceitos esperados: ${concepts}. A resposta deve apresentar contexto, ação e resultado.`,
    };
  }
  return {
    prompt: `${ref}Explique ${skill.name} e como você o aplicou em um projeto real. Cite um problema concreto, a solução adotada e o resultado obtido.`,
    rubric: `Conceitos esperados: ${concepts}. A resposta deve demonstrar definição correta, aplicação prática e resultado.`,
  };
}

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async analyzeResume(rawText: string): Promise<ResumeAnalysisData> {
    const detected = detectResumeSkills(rawText);
    const experiences = extractExperiences(rawText);
    const education = extractEducation(rawText);
    const name = extractName(rawText);
    const certifications = extractCertifications(rawText);
    const courses = extractCourses(rawText);

    const merged = new Map<string, ResumeAnalysisData["skills"][number]>();
    const add = (s: ResumeAnalysisData["skills"][number]) => {
      if (!merged.has(s.name)) merged.set(s.name, s);
    };
    for (const s of detected) add(s);
    for (const c of [...courses, ...certifications]) {
      for (const s of detectSkills(c.name)) {
        add({ ...s, evidence: `Curso/certificação: ${c.name}` });
      }
    }
    const skills = [...merged.values()];

    const projectRe = /(projeto)[^\n.]{0,100}/gi;
    const projects = (rawText.match(projectRe) ?? []).slice(0, 5).map((p) => ({
      name: p.trim().slice(0, 80),
      technologies: detectSkills(p).map((s) => s.name),
    }));

    return {
      name,
      headline: experiences[0]?.role,
      summary:
        skills.length > 0
          ? `Perfil com ${skills.length} competências identificadas (tecnologias, cursos e habilidades) e ${experiences.length} experiência(s) profissional(is) mencionada(s).`
          : "Currículo analisado. Nenhuma competência reconhecida automaticamente — complete seu perfil manualmente.",
      education,
      courses,
      experiences,
      projects,
      certifications,
      skills,
    };
  }

  async analyzeJob(description: string, title: string): Promise<JobAnalysisData> {
    const skills = detectSkills(`${title}\n${description}`);
    const levelMatch = description.match(/\b(júnior|junior|pleno|sênior|senior)\b/i);
    const level = levelMatch
      ? levelMatch[1].charAt(0).toUpperCase() + levelMatch[1].slice(1).toLowerCase()
      : "Pleno";
    const expMatch = description.match(/(\d+)\s*(anos?|ano)/i);
    const minExperienceYears = expMatch ? parseInt(expMatch[1]) : 0;
    const mandatory: JobAnalysisData["mandatory"] = [];
    const desirable: JobAnalysisData["desirable"] = [];
    for (const s of skills) {
      const idx = normalize(description).indexOf(normalize(s.name));
      const before = idx >= 0 ? description.slice(Math.max(0, idx - 200), idx) : "";
      const sentence = before.split(/[;\n]|\.(?=\s|$)/).pop() ?? "";
      const lower = sentence.toLowerCase();
      const lastMandatory = Math.max(
        lower.lastIndexOf("obrigat"),
        lower.lastIndexOf("requisito"),
        lower.lastIndexOf("necess"),
        lower.lastIndexOf("imprescind")
      );
      const lastDesirable = Math.max(
        lower.lastIndexOf("desej"),
        lower.lastIndexOf("diferencial"),
        lower.lastIndexOf("plus"),
        lower.lastIndexOf("opcional")
      );
      if (lastDesirable > lastMandatory) {
        desirable.push({ skill: s.name, minScore: 60 });
      } else {
        mandatory.push({ skill: s.name, minScore: 70 });
      }
    }

    return {
      title,
      level,
      summary: `Vaga de ${title} nível ${level}. ${mandatory.length} competência(s) obrigatória(s) e ${desirable.length} desejável(is) identificadas automaticamente. Revise os critérios antes de publicar.`,
      technologies: skills.map((s) => s.name),
      mandatory,
      desirable,
      minExperienceYears,
      minOverallScore: 70,
    };
  }

  async generateAssessment(
    context: CandidateContext,
    options?: AssessmentOptions
  ): Promise<AssessmentDraft> {
    const level = context.level;
    const items: AssessmentDraft["items"] = [];

    const informed = context.skills.filter((s) => s.source === "INFORMED");
    const pool = informed.length > 0 ? informed : context.skills;

    const chosen = options?.skill
      ? pool.find((s) => s.name === options.skill) ??
        context.skills.find((s) => s.name === options.skill)
      : undefined;

    if (chosen) {
      const count = options?.questionCount ?? 10;
      const ref: SkillRef = {
        name: chosen.name,
        category: chosen.category,
        evidence: chosen.evidence,
        origin: chosen.origin,
      };
      const evidence = chosen.evidence?.trim();
      const contextLine = evidence
        ? `No seu currículo consta: "${evidence}".`
        : `Competência identificada no seu perfil.`;

      const mcqCount = Math.max(1, count - 1);
      for (const q of knowledgeQuestions(ref, mcqCount)) {
        items.push({
          skill: chosen.name,
          type: "MULTIPLE_CHOICE",
          prompt: `${contextLine}\n\n${q.prompt}`,
          options: q.options,
          correctIndex: q.correctIndex,
        });
      }

      const open = openItemFor(ref);
      items.push({
        skill: chosen.name,
        type: "OPEN",
        prompt: open.prompt,
        rubric: open.rubric,
      });

      const language = this.languageFor(chosen.name);
      if (language) {
        const task = this.codeTask(chosen.name, level);
        items.push({
          skill: chosen.name,
          type: "CODE",
          prompt: `${contextLine}\n\n${task.prompt}`,
          language,
          starterCode: task.starterCode,
          testCases: task.testCases,
        });
      }

      return {
        title: `Avaliação de ${chosen.name} — ${context.name}`,
        level,
        items: shuffleItems(items),
      };
    }

    const byEvidence = (
      a: { evidence?: string | null },
      b: { evidence?: string | null }
    ) => (b.evidence ? 1 : 0) - (a.evidence ? 1 : 0);
    const techSkills = pool
      .filter((s) => s.category !== "SOFT_SKILL")
      .sort(byEvidence)
      .slice(0, 4);
    const softSkills = pool
      .filter((s) => s.category === "SOFT_SKILL")
      .sort(byEvidence)
      .slice(0, 2);
    const skills = [...techSkills, ...softSkills];

    const resumeRef =
      context.resume?.summary ||
      (context.resume
        ? `currículo "${context.resume.fileName}"`
        : "seu currículo");

    for (const skill of skills) {
      const evidence = skill.evidence?.trim();
      const contextLine = evidence
        ? `No seu currículo consta: "${evidence}".`
        : `Competência identificada em ${resumeRef}`;

      const ref: SkillRef = {
        name: skill.name,
        category: skill.category,
        evidence: skill.evidence,
        origin: skill.origin,
      };

      for (const q of knowledgeQuestions(ref, 2)) {
        items.push({
          skill: skill.name,
          type: "MULTIPLE_CHOICE",
          prompt: `${contextLine}.\n\n${q.prompt}`,
          options: q.options,
          correctIndex: q.correctIndex,
        });
      }

      const open = openItemFor(ref);
      items.push({
        skill: skill.name,
        type: "OPEN",
        prompt: open.prompt,
        rubric: open.rubric,
      });

      const language = this.languageFor(skill.name);
      if (language) {
        const task = this.codeTask(skill.name, level);
        items.push({
          skill: skill.name,
          type: "CODE",
          prompt: `${contextLine}.\n\n${task.prompt}`,
          language,
          starterCode: task.starterCode,
          testCases: task.testCases,
        });
      }
    }

    return {
      title: `Avaliação personalizada — ${context.name}`,
      level,
      items: shuffleItems(items),
    };
  }

  private languageFor(skill: string): string | null {
    const map: Record<string, string> = {
      PHP: "php",
      Laravel: "php",
      JavaScript: "javascript",
      "Node.js": "javascript",
      React: "javascript",
      "Next.js": "javascript",
      TypeScript: "javascript",
      Python: "python",
      Django: "python",
      Java: "java",
      "Spring Boot": "java",
    };
    return map[skill] ?? null;
  }

  private codeTask(skill: string, level: string) {
    const tasks: Record<
      string,
      {
        prompt: string;
        starterCode: string;
        testCases: { input: string; expectedOutput: string; description?: string }[];
      }
    > = {
      PHP: {
        prompt:
          "Escreva uma função PHP `somaPares(array $numeros): int` que retorne a soma de todos os números pares do array. Leia o array da entrada padrão (uma linha com números separados por espaço) e imprima o resultado.",
        starterCode:
          "<?php\nfunction somaPares(array $numeros): int {\n    // seu código aqui\n}\n\n$linha = trim(fgets(STDIN));\n$numeros = array_map('intval', explode(' ', $linha));\necho somaPares($numeros) . \"\\n\";\n",
        testCases: [
          { input: "1 2 3 4 5 6", expectedOutput: "12", description: "Pares 2+4+6" },
          { input: "10 15 20", expectedOutput: "30", description: "Pares 10+20" },
          { input: "1 3 5", expectedOutput: "0", description: "Sem pares" },
        ],
      },
      JavaScript: {
        prompt:
          "Escreva uma função JavaScript `somaPares(numeros)` que retorne a soma dos números pares. Leia a linha da entrada padrão (process.stdin) e imprima o resultado com console.log.",
        starterCode:
          "function somaPares(numeros) {\n  // seu código aqui\n}\n\nlet data = '';\nprocess.stdin.on('data', (c) => (data += c));\nprocess.stdin.on('end', () => {\n  const nums = data.trim().split(/\\s+/).map(Number);\n  console.log(somaPares(nums));\n});\n",
        testCases: [
          { input: "1 2 3 4 5 6", expectedOutput: "12" },
          { input: "10 15 20", expectedOutput: "30" },
          { input: "1 3 5", expectedOutput: "0" },
        ],
      },
      Python: {
        prompt:
          "Escreva uma função Python `soma_pares(numeros)` que retorne a soma dos números pares. Leia a linha da entrada padrão e imprima o resultado.",
        starterCode:
          "def soma_pares(numeros):\n    # seu código aqui\n    pass\n\nlinha = input().strip()\nnumeros = [int(x) for x in linha.split()]\nprint(soma_pares(numeros))\n",
        testCases: [
          { input: "1 2 3 4 5 6", expectedOutput: "12" },
          { input: "10 15 20", expectedOutput: "30" },
          { input: "1 3 5", expectedOutput: "0" },
        ],
      },
      Java: {
        prompt:
          "Escreva um programa Java que leia uma linha com números separados por espaço e imprima a soma dos números pares.",
        starterCode:
          "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String linha = sc.nextLine();\n        int soma = 0;\n        // seu código aqui\n        System.out.println(soma);\n    }\n}\n",
        testCases: [
          { input: "1 2 3 4 5 6", expectedOutput: "12" },
          { input: "10 15 20", expectedOutput: "30" },
          { input: "1 3 5", expectedOutput: "0" },
        ],
      },
    };
    return tasks[skill] ?? tasks.JavaScript;
  }

  async gradeOpenAnswer(
    prompt: string,
    rubric: string,
    answer: string
  ): Promise<GradeResult> {
    const words = answer.trim().split(/\s+/).filter(Boolean);
    const lengthScore = Math.min(20, Math.round((words.length / 60) * 20));
    const expectedMatch = rubric.match(/conceitos esperados:\s*([^.]*)/i);
    const expected = expectedMatch
      ? expectedMatch[1]
          .split(/[,;]/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const keywords = expected.length
      ? expected
      : rubric
          .toLowerCase()
          .match(/[a-zà-ú]{5,}/g)
          ?.filter((w) => !["resposta", "deve", "demonstrar", "menção", "práticas", "concreto"].includes(w)) ?? [];
    const answerNorm = normalize(answer);
    const hits = keywords.filter((k) => answerNorm.includes(normalize(k))).length;
    const keywordScore = keywords.length
      ? Math.min(60, Math.round((hits / Math.min(keywords.length, 8)) * 60))
      : answer.trim()
        ? 20
        : 0;
    const hasExample = /exemplo|projeto|caso|cenário|cenario|na prática|na pratica/i.test(answer);
    const hasReasoning = /porque|portanto|assim|quando|então|entao|logo|dessa forma|ou seja/i.test(answer);
    const structureScore = (hasExample ? 12 : 0) + (hasReasoning ? 8 : 0);
    const score = Math.max(0, Math.min(100, lengthScore + keywordScore + structureScore));
    const feedback =
      score >= 80
        ? "Resposta completa, com bom domínio conceitual e exemplo prático."
        : score >= 60
          ? "Resposta adequada, mas poderia detalhar melhor a aplicação prática e os trade-offs."
          : "Resposta superficial. Faltam conceitos-chave e um exemplo concreto de aplicação.";
    return {
      score,
      feedback,
      breakdown: `Extensão: ${lengthScore}/20 · Conceitos: ${keywordScore}/60 · Estrutura: ${structureScore}/20`,
    };
  }

  async analyzeCode(
    prompt: string,
    language: string,
    code: string,
    testSummary: { passed: number; total: number; failures: string[] }
  ): Promise<GradeResult> {
    const testScore = testSummary.total
      ? (testSummary.passed / testSummary.total) * 60
      : 0;
    const lines = code.split("\n").filter((l) => l.trim()).length;
    const hasComments = /\/\/|\/\*|#/.test(code);
    const hasFunctions = /function|def |public |private |class /.test(code);
    const qualityScore =
      (lines >= 5 ? 15 : 8) + (hasFunctions ? 15 : 5) + (hasComments ? 10 : 5);
    const score = Math.round(Math.min(100, testScore + qualityScore));
    const feedback =
      testSummary.passed === testSummary.total
        ? "Todos os casos de teste passaram. Código funcional e organizado."
        : `Passou em ${testSummary.passed}/${testSummary.total} casos de teste. ${
            testSummary.failures[0] ?? ""
          }`.trim();
    return {
      score,
      feedback,
      breakdown: `Casos de teste: ${Math.round(testScore)}/60 · Qualidade: ${qualityScore}/40`,
    };
  }

  async recommendCourses(
    context: CandidateContext,
    scores: { skill: string; score: number | null }[]
  ): Promise<CourseSuggestion[]> {
    const catalog: Record<
      string,
      { title: string; provider: string; level: string; hours: number; url: string }
    > = {
      PHP: {
        title: "PHP: do básico ao avançado",
        provider: "Alura",
        level: "Intermediário",
        hours: 40,
        url: "https://www.alura.com.br/cursos-online-programacao/php",
      },
      MySQL: {
        title: "MySQL: consultas e modelagem de dados",
        provider: "Alura",
        level: "Intermediário",
        hours: 30,
        url: "https://www.alura.com.br/cursos-online-banco-de-dados/mysql",
      },
      Laravel: {
        title: "Laravel: desenvolvimento web profissional",
        provider: "Udemy",
        level: "Intermediário",
        hours: 45,
        url: "https://www.udemy.com/topic/laravel/",
      },
      JavaScript: {
        title: "JavaScript moderno: fundamentos e prática",
        provider: "freeCodeCamp",
        level: "Intermediário",
        hours: 50,
        url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
      },
      Docker: {
        title: "Docker para desenvolvedores",
        provider: "Udemy",
        level: "Iniciante",
        hours: 20,
        url: "https://www.udemy.com/topic/docker/",
      },
      Git: {
        title: "Git e GitHub: controle de versão na prática",
        provider: "Alura",
        level: "Iniciante",
        hours: 12,
        url: "https://www.alura.com.br/curso-online-git-github-controle-de-versao",
      },
      "Lógica de programação": {
        title: "Lógica de programação com exercícios",
        provider: "freeCodeCamp",
        level: "Iniciante",
        hours: 25,
        url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/",
      },
      Python: {
        title: "Python para todos",
        provider: "Coursera",
        level: "Iniciante",
        hours: 35,
        url: "https://www.coursera.org/specializations/python",
      },
      Java: {
        title: "Java completo: orientação a objetos",
        provider: "Udemy",
        level: "Intermediário",
        hours: 60,
        url: "https://www.udemy.com/topic/java/",
      },
      React: {
        title: "React: construindo interfaces modernas",
        provider: "Alura",
        level: "Intermediário",
        hours: 40,
        url: "https://www.alura.com.br/cursos-online-front-end/react",
      },
      "REST APIs": {
        title: "APIs REST: design e boas práticas",
        provider: "Alura",
        level: "Intermediário",
        hours: 20,
        url: "https://www.alura.com.br/cursos-online-programacao/apis",
      },
      "Testes automatizados": {
        title: "Testes automatizados: TDD na prática",
        provider: "Udemy",
        level: "Intermediário",
        hours: 25,
        url: "https://www.udemy.com/topic/tdd/",
      },
      HTML: {
        title: "HTML5: fundamentos para páginas web modernas",
        provider: "freeCodeCamp",
        level: "Iniciante",
        hours: 20,
        url: "https://www.freecodecamp.org/learn/responsive-web-design/",
      },
      CSS: {
        title: "CSS: estilização e layout responsivo",
        provider: "freeCodeCamp",
        level: "Iniciante",
        hours: 25,
        url: "https://www.freecodecamp.org/learn/responsive-web-design/",
      },
      Bootstrap: {
        title: "Bootstrap: interfaces responsivas",
        provider: "Udemy",
        level: "Iniciante",
        hours: 15,
        url: "https://www.udemy.com/topic/bootstrap/",
      },
      Cibersegurança: {
        title: "Introdução à Cibersegurança",
        provider: "Cisco NetAcad",
        level: "Iniciante",
        hours: 30,
        url: "https://www.netacad.com/courses/cybersecurity/introduction-cybersecurity",
      },
      "Segurança de endpoint": {
        title: "Segurança de Endpoint",
        provider: "Cisco NetAcad",
        level: "Intermediário",
        hours: 25,
        url: "https://www.netacad.com/courses/cybersecurity/endpoint-security",
      },
      "Defesa de rede": {
        title: "Defesa de Rede",
        provider: "Cisco NetAcad",
        level: "Intermediário",
        hours: 25,
        url: "https://www.netacad.com/courses/cybersecurity/network-defense",
      },
      Inglês: {
        title: "Inglês para tecnologia",
        provider: "Coursera",
        level: "Iniciante",
        hours: 40,
        url: "https://www.alura.com.br/cursos-online-idiomas/ingles",
      },
      Comunicação: {
        title: "Comunicação eficaz no trabalho",
        provider: "Alura",
        level: "Iniciante",
        hours: 10,
        url: "https://www.alura.com.br/cursos-online-carreira",
      },
      "Trabalho em equipe": {
        title: "Colaboração e trabalho em equipe",
        provider: "Alura",
        level: "Iniciante",
        hours: 8,
        url: "https://www.alura.com.br/cursos-online-carreira",
      },
      Organização: {
        title: "Organização e produtividade pessoal",
        provider: "Alura",
        level: "Iniciante",
        hours: 8,
        url: "https://www.alura.com.br/cursos-online-carreira",
      },
      Adaptabilidade: {
        title: "Adaptabilidade e aprendizado contínuo",
        provider: "Alura",
        level: "Iniciante",
        hours: 8,
        url: "https://www.alura.com.br/cursos-online-carreira",
      },
      Comprometimento: {
        title: "Comprometimento e foco em resultados",
        provider: "Alura",
        level: "Iniciante",
        hours: 8,
        url: "https://www.alura.com.br/cursos-online-carreira",
      },
    };

    const suggestions: CourseSuggestion[] = [];
    const scoreMap = new Map(scores.map((s) => [s.skill, s.score]));

    for (const s of scores) {
      const c = catalog[s.skill];
      if (!c) continue;
      if (s.score === null) {
        suggestions.push({
          skill: s.skill,
          ...c,
          reason: `Competência ${s.skill} ainda não avaliada. Recomendamos estudo para depois comprovar seu domínio na plataforma.`,
          priority: 3,
        });
      } else if (s.score < 70) {
        suggestions.push({
          skill: s.skill,
          ...c,
          reason: `Sua avaliação de ${s.skill} foi ${Math.round(s.score)}/100. Recomendado para reforçar as lacunas identificadas nos testes.`,
          priority: 1,
        });
      } else {
        suggestions.push({
          skill: s.skill,
          ...c,
          reason: `Você foi bem em ${s.skill} (${Math.round(s.score)}/100). Recomendado para aprofundar e consolidar o conhecimento.`,
          priority: 2,
        });
      }
    }

    const informed = context.skills.map((s) => s.name);
    for (const name of informed) {
      if (!scoreMap.has(name) && catalog[name] && !suggestions.some((s) => s.skill === name)) {
        suggestions.push({
          skill: name,
          ...catalog[name],
          reason: `${name} consta no seu perfil, mas ainda não foi comprovado por teste. Estude e realize a avaliação para validar essa competência.`,
          priority: 3,
        });
      }
    }

    return suggestions.slice(0, 8);
  }
}

export { LEVELS, inferLevel, monthsBetween };
