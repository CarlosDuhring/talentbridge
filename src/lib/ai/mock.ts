import type {
  AIProvider,
  AssessmentDraft,
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

function extractName(text: string): string | undefined {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    const words = line.split(/\s+/);
    if (
      words.length >= 2 &&
      words.length <= 5 &&
      words.every((w) => /^[A-ZÀ-Ú][a-zà-ú'.-]+$/.test(w)) &&
      !/currículo|curriculum|vitae|desenvolvedor|analista|programador/i.test(line)
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
  const headerRe = /^(certifica(?:ç|c)(?:ões|ao|ão)|certificados?)\s*:?\s*$/i;
  const inlineRe = /(certifica(?:ç|c)(?:ão|ões|ao|oes)|certificados?)[ \t]*:?[ \t]*([^\n.]{3,80})/gi;
  const seen = new Set<string>();

  function push(raw: string) {
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 100);
    if (name.length < 3) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const yearMatch = name.match(/(19|20)\d{2}/);
    out.push({
      name,
      year: yearMatch ? parseInt(yearMatch[0]) : undefined,
    });
  }

  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i])) {
      for (let j = i + 1; j < lines.length && j <= i + 5; j++) {
        if (headerRe.test(lines[j])) break;
        if (/^(experi[êe]ncia|forma[çc][ãa]o|habilidades|projetos|idiomas|objetivo)/i.test(lines[j])) break;
        push(lines[j].replace(/^[-•*]\s*/, ""));
      }
    }
  }

  for (const m of text.matchAll(inlineRe)) {
    if (m[2]) push(m[2]);
  }

  return out.slice(0, 5);
}

function extractCourses(text: string) {
  const out: ResumeAnalysisData["courses"] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const headerRe = /^(cursos?|capacita(?:ç|c)(?:ões|ao|ão)|treinamentos?)\s*:?\s*$/i;
  const inlineRe = /(cursos?|capacita(?:ç|c)(?:ão|ões|ao|oes)|treinamentos?)[ \t]*:?[ \t]*([^\n.]{3,80})/gi;
  const seen = new Set<string>();

  function push(raw: string) {
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 100);
    if (name.length < 3) return;
    if (/^(cursos?|capacita|treinamentos?)$/i.test(name)) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const yearMatch = name.match(/(19|20)\d{2}/);
    out.push({
      name,
      year: yearMatch ? parseInt(yearMatch[0]) : undefined,
    });
  }

  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i])) {
      for (let j = i + 1; j < lines.length && j <= i + 6; j++) {
        if (headerRe.test(lines[j])) break;
        if (/^(experi[êe]ncia|forma[çc][ãa]o|habilidades|certifica|projetos|idiomas|objetivo)/i.test(lines[j])) break;
        push(lines[j].replace(/^[-•*]\s*/, ""));
      }
    }
  }

  for (const m of text.matchAll(inlineRe)) {
    if (m[2]) push(m[0]);
  }

  return out.slice(0, 6);
}

function extractEducation(text: string) {
  const out: ResumeAnalysisData["education"] = [];
  const re =
    /(técnico|tecnólogo|bacharelado|licenciatura|graduação|mestrado|pós-graduação|ensino médio)[^\n.]{0,80}/gi;
  const matches = text.match(re) ?? [];
  for (const m of matches.slice(0, 4)) {
    const yearMatch = m.match(/(19|20)\d{2}/);
    out.push({
      institution: "Instituição identificada no currículo",
      course: m.trim(),
      level: /mestrado|pós/i.test(m)
        ? "PÓS-GRADUAÇÃO"
        : /bacharelado|licenciatura|graduação|tecnólogo/i.test(m)
          ? "GRADUAÇÃO"
          : /técnico/i.test(m)
            ? "TÉCNICO"
            : "ENSINO_MEDIO",
      endYear: yearMatch ? parseInt(yearMatch[0]) : undefined,
    });
  }
  return out;
}

function extractExperiences(text: string) {
  const out: ResumeAnalysisData["experiences"] = [];
  const roleRe =
    /(desenvolvedor[a]?|programador[a]?|analista|engenheiro[a]?|estagiário[a]?|técnico[a]?)[^\n]{0,60}/gi;
  const matches = text.match(roleRe) ?? [];
  const seen = new Set<string>();
  for (const m of matches.slice(0, 6)) {
    const role = m.trim().replace(/\s+/g, " ");
    if (seen.has(role.toLowerCase())) continue;
    seen.add(role.toLowerCase());
    const years = m.match(/(\d+)\s*(anos?|ano)/i);
    const months = years ? parseInt(years[1]) * 12 : 12;
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    out.push({
      company: "Empresa identificada no currículo",
      role,
      startDate: start.toISOString().slice(0, 10),
      current: /atual|presente/i.test(text),
      technologies: detectSkills(m).map((s) => s.name),
    });
  }
  return out;
}

export class MockProvider implements AIProvider {
  readonly name = "mock";

  async analyzeResume(rawText: string): Promise<ResumeAnalysisData> {
    const skills = detectResumeSkills(rawText);
    const experiences = extractExperiences(rawText);
    const education = extractEducation(rawText);
    const name = extractName(rawText);
    const certifications = extractCertifications(rawText);
    const courses = extractCourses(rawText);
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
          ? `Perfil com ${skills.length} tecnologias identificadas e ${experiences.length} experiência(s) profissional(is) mencionada(s).`
          : "Currículo analisado. Nenhuma tecnologia reconhecida automaticamente — complete seu perfil manualmente.",
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

  async generateAssessment(context: CandidateContext): Promise<AssessmentDraft> {
    const level = context.level;
    const items: AssessmentDraft["items"] = [];
    const prioritized = [...context.skills].sort((a, b) => {
      const rank = (s: { source: string }) => (s.source === "INFORMED" ? 0 : 1);
      return rank(a) - rank(b);
    });
    const skills = prioritized.slice(0, 4);

    for (const skill of skills) {
      const cat = skill.category;
      const isLang = cat === "LINGUAGEM" || cat === "BANCO_DE_DADOS";
      const isFramework = cat === "FRAMEWORK";

      items.push({
        skill: skill.name,
        type: "MULTIPLE_CHOICE",
        prompt: this.mcqPrompt(skill.name, level, 0),
        options: this.mcqOptions(skill.name, 0),
        correctIndex: 0,
      });
      items.push({
        skill: skill.name,
        type: "MULTIPLE_CHOICE",
        prompt: this.mcqPrompt(skill.name, level, 1),
        options: this.mcqOptions(skill.name, 1),
        correctIndex: 2,
      });
      items.push({
        skill: skill.name,
        type: "OPEN",
        prompt: `Explique, com suas palavras, como você aplicaria ${skill.name} em um projeto real. Cite um problema concreto, a solução adotada e o resultado obtido.`,
        rubric: `Resposta deve demonstrar: (1) entendimento conceitual de ${skill.name}; (2) aplicação prática com exemplo concreto; (3) vocabulário técnico correto; (4) menção a trade-offs ou boas práticas.`,
      });

      if (isLang || isFramework) {
        const language = this.languageFor(skill.name);
        if (language) {
          const task = this.codeTask(skill.name, level);
          items.push({
            skill: skill.name,
            type: "CODE",
            prompt: task.prompt,
            language,
            starterCode: task.starterCode,
            testCases: task.testCases,
          });
        }
      }
    }

    return {
      title: `Avaliação personalizada — ${context.name}`,
      level,
      items,
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
      MySQL: "javascript",
      SQL: "javascript",
      PostgreSQL: "javascript",
    };
    return map[skill] ?? null;
  }

  private mcqPrompt(skill: string, level: string, variant: number): string {
    const prompts: Record<string, string[]> = {
      PHP: [
        "Qual a diferença entre `==` e `===` no PHP?",
        "O que a função `array_map` faz no PHP?",
      ],
      JavaScript: [
        "Qual a diferença entre `let`, `const` e `var` em JavaScript?",
        "O que é uma Promise e para que serve?",
      ],
      MySQL: [
        "Qual cláusula SQL é usada para filtrar resultados de um `GROUP BY`?",
        "O que um `INNER JOIN` retorna?",
      ],
      SQL: [
        "Qual comando SQL remove linhas de uma tabela?",
        "Para que serve um índice em um banco de dados?",
      ],
      Laravel: [
        "O que é o Eloquent ORM no Laravel?",
        "Para que serve o arquivo `.env` em um projeto Laravel?",
      ],
      Python: [
        "Qual a diferença entre lista e tupla em Python?",
        "O que é um generator em Python?",
      ],
      Java: [
        "Qual a diferença entre `ArrayList` e `LinkedList`?",
        "O que é o garbage collector da JVM?",
      ],
      Git: [
        "Qual a diferença entre `git fetch` e `git pull`?",
        "Para que serve um branch no Git?",
      ],
      Docker: [
        "Qual a diferença entre imagem e container Docker?",
        "Para que serve um Dockerfile?",
      ],
      "Lógica de programação": [
        "O que é complexidade de algoritmo O(n log n)?",
        "Qual estrutura de dados é mais adequada para uma fila FIFO?",
      ],
    };
    const list = prompts[skill] ?? [
      `Qual alternativa descreve corretamente um conceito fundamental de ${skill}?`,
      `Em um cenário de nível ${level}, qual prática é recomendada ao usar ${skill}?`,
    ];
    return list[variant % list.length];
  }

  private mcqOptions(skill: string, variant: number): string[] {
    const generic = [
      [
        "A primeira compara valor e tipo; a segunda compara apenas valor.",
        "Ambas comparam valor e tipo da mesma forma.",
        "A primeira é usada apenas em loops.",
        "Nenhuma das anteriores.",
      ],
      [
        "Aplica uma função a cada elemento e retorna um novo array.",
        "Ordena um array em ordem crescente.",
        "Remove elementos duplicados.",
        "Converte um array em string.",
      ],
    ];
    const bySkill: Record<string, string[][]> = {
      PHP: [
        [
          "`==` compara apenas valor; `===` compara valor e tipo.",
          "`===` compara apenas valor; `==` compara valor e tipo.",
          "Ambos são idênticos.",
          "`==` só funciona com números.",
        ],
        [
          "Aplica um callback a cada elemento e retorna um novo array.",
          "Ordena o array.",
          "Remove o último elemento.",
          "Conta os elementos do array.",
        ],
      ],
      JavaScript: [
        [
          "`let` e `const` têm escopo de bloco; `var` tem escopo de função.",
          "`var` tem escopo de bloco; `let` tem escopo global.",
          "Todos têm o mesmo escopo.",
          "`const` permite reatribuição.",
        ],
        [
          "Representa um valor que estará disponível no futuro.",
          "Um tipo de loop assíncrono.",
          "Uma função que executa imediatamente.",
          "Um erro de execução.",
        ],
      ],
      MySQL: [
        [
          "`HAVING`.",
          "`WHERE`.",
          "`ORDER BY`.",
          "`LIMIT`.",
        ],
        [
          "Apenas linhas com correspondência nas duas tabelas.",
          "Todas as linhas da tabela da esquerda.",
          "Todas as linhas das duas tabelas, com NULL onde não houver correspondência.",
          "A união de todas as linhas.",
        ],
      ],
      SQL: [
        ["`DELETE`.", "`DROP`.", "`TRUNCATE`.", "`REMOVE`."],
        [
          "Acelerar a busca de registros.",
          "Compactar o banco.",
          "Criar backup automático.",
          "Validar tipos de dados.",
        ],
      ],
      Laravel: [
        [
          "Um ORM que mapeia tabelas para modelos PHP.",
          "Um sistema de templates.",
          "Um gerenciador de filas.",
          "Um servidor web embutido.",
        ],
        [
          "Armazenar variáveis de ambiente e configurações sensíveis.",
          "Definir rotas da aplicação.",
          "Configurar o banco de dados apenas.",
          "Listar dependências do projeto.",
        ],
      ],
      Python: [
        [
          "Listas são mutáveis; tuplas são imutáveis.",
          "Tuplas são mutáveis; listas são imutáveis.",
          "Ambas são imutáveis.",
          "Listas só aceitam números.",
        ],
        [
          "Uma função que produz valores sob demanda, com `yield`.",
          "Uma lista infinita.",
          "Um tipo de classe.",
          "Um decorator.",
        ],
      ],
      Java: [
        [
          "`ArrayList` usa array interno; `LinkedList` usa nós encadeados.",
          "`LinkedList` é sempre mais rápida.",
          "`ArrayList` não permite remoção.",
          "Não há diferença prática.",
        ],
        [
          "Gerencia automaticamente a memória de objetos não utilizados.",
          "Compila o código em tempo de execução.",
          "Executa threads em paralelo.",
          "Otimiza consultas SQL.",
        ],
      ],
      Git: [
        [
          "`fetch` baixa sem mesclar; `pull` baixa e mescla.",
          "`pull` baixa sem mesclar; `fetch` baixa e mescla.",
          "Ambos apenas baixam.",
          "`fetch` envia commits.",
        ],
        [
          "Isolar linhas de desenvolvimento.",
          "Fazer backup do repositório.",
          "Excluir commits antigos.",
          "Renomear o projeto.",
        ],
      ],
      Docker: [
        [
          "Imagem é o modelo imutável; container é uma instância em execução.",
          "Container é o modelo; imagem é a instância.",
          "Ambos são a mesma coisa.",
          "Imagem só existe em produção.",
        ],
        [
          "Definir os passos para construir uma imagem.",
          "Executar o container.",
          "Gerenciar volumes.",
          "Configurar a rede do host.",
        ],
      ],
      "Lógica de programação": [
        [
          "Crescimento proporcional a n multiplicado pelo logaritmo de n.",
          "Crescimento linear.",
          "Crescimento quadrático.",
          "Crescimento constante.",
        ],
        [
          "Fila (Queue).",
          "Pilha (Stack).",
          "Árvore binária.",
          "Grafo.",
        ],
      ],
    };
    const list = bySkill[skill] ?? generic;
    return list[variant % list.length];
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
    const lengthScore = Math.min(40, Math.round((words.length / 80) * 40));
    const keywords = rubric
      .toLowerCase()
      .match(/[a-zà-ú]{5,}/g)
      ?.filter((w) => !["resposta", "deve", "demonstrar", "menção", "práticas", "concreto"].includes(w)) ?? [];
    const answerNorm = normalize(answer);
    const hits = keywords.filter((k) => answerNorm.includes(normalize(k))).length;
    const keywordScore = keywords.length
      ? Math.min(45, Math.round((hits / Math.min(keywords.length, 8)) * 45))
      : 30;
    const structureScore = /porque|portanto|assim|exemplo|quando|então|logo/i.test(answer)
      ? 15
      : 5;
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
      breakdown: `Extensão: ${lengthScore}/40 · Conceitos: ${keywordScore}/45 · Estrutura: ${structureScore}/15`,
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
    };

    const suggestions: CourseSuggestion[] = [];
    const scoreMap = new Map(scores.map((s) => [s.skill, s.score]));

    for (const s of scores) {
      if (s.score === null) {
        const c = catalog[s.skill];
        if (c) {
          suggestions.push({
            skill: s.skill,
            ...c,
            reason: `Competência ${s.skill} ainda não avaliada. Recomendamos estudo para depois comprovar seu domínio na plataforma.`,
            priority: 2,
          });
        }
      } else if (s.score < 70) {
        const c = catalog[s.skill];
        if (c) {
          suggestions.push({
            skill: s.skill,
            ...c,
            reason: `Sua avaliação de ${s.skill} foi ${Math.round(s.score)}/100. Recomendado para reforçar as lacunas identificadas nos testes.`,
            priority: 1,
          });
        }
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
