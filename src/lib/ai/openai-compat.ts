import type {
  AIProvider,
  AssessmentDraft,
  CandidateContext,
  CourseSuggestion,
  GradeResult,
  JobAnalysisData,
  ResumeAnalysisData,
} from "./types";
import { MockProvider } from "./mock";

type ChatMessage = { role: "system" | "user"; content: string };

export class OpenAICompatProvider implements AIProvider {
  readonly name = "openai-compat";
  private baseUrl: string;
  private apiKey: string;
  private model: string;
  private fallback = new MockProvider();

  constructor(baseUrl: string, apiKey: string, model: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.model = model;
  }

  private async chat(messages: ChatMessage[], maxTokens = 3000): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.4,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      throw new Error(`AI provider error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  private async json<T>(messages: ChatMessage[], fallback: () => Promise<T>): Promise<T> {
    try {
      const raw = await this.chat(messages);
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error("[ai] provider falhou, usando mock:", err);
      return fallback();
    }
  }

  async analyzeResume(rawText: string): Promise<ResumeAnalysisData> {
    return this.json(
      [
        {
          role: "system",
          content:
            "Você é um analisador de currículos. Extraia as informações e responda SOMENTE com JSON válido no schema: {name?, headline?, location?, summary, education:[{institution,course,level,startYear?,endYear?}], courses:[{name,issuer?,year?}], experiences:[{company,role,startDate,endDate?,current?,description?,technologies:[]}], projects:[{name,description?,technologies:[]}], certifications:[{name,issuer?,year?}], skills:[{name,category,evidence}]}. category ∈ LINGUAGEM|FRAMEWORK|BANCO_DE_DADOS|FERRAMENTA|FUNDAMENTO|OUTRO. Nunca invente informações que não estejam no texto.",
        },
        { role: "user", content: rawText.slice(0, 24000) },
      ],
      () => this.fallback.analyzeResume(rawText)
    );
  }

  async analyzeJob(description: string, title: string): Promise<JobAnalysisData> {
    return this.json(
      [
        {
          role: "system",
          content:
            "Você analisa descrições de vagas de tecnologia. Responda SOMENTE com JSON: {title?, level, summary, technologies:[], mandatory:[{skill,minScore}], desirable:[{skill,minScore}], minExperienceYears, minOverallScore}. minScore entre 50 e 90. Não use critérios discriminatórios.",
        },
        { role: "user", content: `Título: ${title}\n\n${description}` },
      ],
      () => this.fallback.analyzeJob(description, title)
    );
  }

  async generateAssessment(context: CandidateContext): Promise<AssessmentDraft> {
    return this.json(
      [
        {
          role: "system",
          content:
            "Você gera avaliações técnicas personalizadas a partir do conteúdo real do currículo do candidato. Responda SOMENTE com JSON: {title, level, items:[{skill,type,prompt,options?,correctIndex?,rubric?,starterCode?,language?,testCases?:[{input,expectedOutput,description?}]}]}. type ∈ MULTIPLE_CHOICE|OPEN|CODE. REGRAS: (1) as questões devem TESTAR CONHECIMENTO REAL das competências que aparecem no currículo — nunca autoavaliação, opinião ou perguntas sobre o que o candidato acha que sabe; (2) cada MULTIPLE_CHOICE deve ter 1 alternativa correta e 3 incorretas plausíveis, com correctIndex apontando a correta; (3) cada OPEN deve ter rubrica começando com 'Conceitos esperados:' e a lista de conceitos que a resposta precisa demonstrar; (4) use apenas competências e evidências presentes no currículo/contexto — nunca gere perguntas de um banco fixo nem assuma tecnologias que não apareçam; (5) cada questão deve referenciar a evidência do currículo que a originou; (6) a linguagem de uma questão CODE deve ser a linguagem efetivamente citada no currículo (php|javascript|python|java) e o programa deve ler da entrada padrão e escrever na saída padrão; (7) gere 2 MULTIPLE_CHOICE, 1 OPEN e, quando houver linguagem aplicável, 1 CODE por competência; (8) competências vindas de cursos/certificações e soft skills (category SOFT_SKILL) também devem ser avaliadas — para soft skills use questões situacionais com a melhor conduta e perguntas abertas sobre situações reais. Nível do candidato: " +
            context.level,
        },
        { role: "user", content: JSON.stringify(context) },
      ],
      () => this.fallback.generateAssessment(context)
    );
  }

  async gradeOpenAnswer(prompt: string, rubric: string, answer: string): Promise<GradeResult> {
    return this.json(
      [
        {
          role: "system",
          content:
            "Você corrige respostas abertas técnicas. Responda SOMENTE com JSON: {score, feedback, breakdown}. score de 0 a 100, feedback em português, breakdown explicando os critérios.",
        },
        { role: "user", content: `Pergunta: ${prompt}\nRubrica: ${rubric}\nResposta: ${answer}` },
      ],
      () => this.fallback.gradeOpenAnswer(prompt, rubric, answer)
    );
  }

  async analyzeCode(
    prompt: string,
    language: string,
    code: string,
    testSummary: { passed: number; total: number; failures: string[] }
  ): Promise<GradeResult> {
    return this.json(
      [
        {
          role: "system",
          content:
            "Você analisa código de candidatos. Responda SOMENTE com JSON: {score, feedback, breakdown}. Considere lógica, legibilidade, eficiência e tratamento de erros. O resultado dos testes automáticos é um insumo importante.",
        },
        {
          role: "user",
          content: `Tarefa: ${prompt}\nLinguagem: ${language}\nTestes: ${testSummary.passed}/${testSummary.total} passaram. Falhas: ${testSummary.failures.join("; ")}\n\nCódigo:\n${code}`,
        },
      ],
      () => this.fallback.analyzeCode(prompt, language, code, testSummary)
    );
  }

  async recommendCourses(
    context: CandidateContext,
    scores: { skill: string; score: number | null }[]
  ): Promise<CourseSuggestion[]> {
    const result = await this.json<
      { suggestions?: CourseSuggestion[] } | CourseSuggestion[]
    >(
      [
        {
          role: "system",
          content:
            "Você recomenda cursos para desenvolvedores. Responda SOMENTE com JSON: {suggestions:[{skill,title,provider,level,hours,url,reason,priority}]}. Use provedores reais (Alura, Udemy, Coursera, freeCodeCamp). reason deve citar o resultado da avaliação. priority 1=alta, 2=média, 3=baixa.",
        },
        { role: "user", content: JSON.stringify({ context, scores }) },
      ],
      async () => ({ suggestions: await this.fallback.recommendCourses(context, scores) })
    );
    if (Array.isArray(result)) return result;
    return Array.isArray(result?.suggestions) ? result.suggestions : [];
  }
}
