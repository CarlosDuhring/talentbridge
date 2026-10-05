export type SkillCategory =
  | "LINGUAGEM"
  | "FRAMEWORK"
  | "BANCO_DE_DADOS"
  | "FERRAMENTA"
  | "FUNDAMENTO"
  | "OUTRO";

export type ResumeAnalysisData = {
  name?: string;
  headline?: string;
  location?: string;
  summary: string;
  education: {
    institution: string;
    course: string;
    level: string;
    startYear?: number;
    endYear?: number;
  }[];
  courses: { name: string; issuer?: string; year?: number }[];
  experiences: {
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    technologies: string[];
  }[];
  projects: { name: string; description?: string; technologies: string[] }[];
  certifications: { name: string; issuer?: string; year?: number }[];
  skills: { name: string; category: SkillCategory; evidence: string }[];
};

export type JobAnalysisData = {
  title?: string;
  level: string;
  summary: string;
  technologies: string[];
  mandatory: { skill: string; minScore: number }[];
  desirable: { skill: string; minScore: number }[];
  minExperienceYears: number;
  minOverallScore: number;
};

export type AssessmentItemDraft = {
  skill: string;
  type: "MULTIPLE_CHOICE" | "OPEN" | "CODE";
  prompt: string;
  options?: string[];
  correctIndex?: number;
  rubric?: string;
  starterCode?: string;
  language?: string;
  testCases?: { input: string; expectedOutput: string; description?: string }[];
};

export type AssessmentDraft = {
  title: string;
  level: string;
  items: AssessmentItemDraft[];
};

export type GradeResult = {
  score: number;
  feedback: string;
  breakdown?: string;
};

export type CourseSuggestion = {
  skill: string;
  title: string;
  provider: string;
  level: string;
  hours: number;
  url: string;
  reason: string;
  priority: number;
};

export type CandidateContext = {
  candidateId: string;
  name: string;
  headline?: string | null;
  objective?: string | null;
  level: string;
  skills: { name: string; category: string; source: string; evidence?: string | null }[];
  experiences: {
    role: string;
    company: string;
    technologies: string[];
    months: number;
  }[];
  projects: { name: string; technologies: string[] }[];
  education: { course: string; level: string }[];
};

export interface AIProvider {
  readonly name: string;
  analyzeResume(rawText: string): Promise<ResumeAnalysisData>;
  analyzeJob(description: string, title: string): Promise<JobAnalysisData>;
  generateAssessment(context: CandidateContext): Promise<AssessmentDraft>;
  gradeOpenAnswer(
    prompt: string,
    rubric: string,
    answer: string
  ): Promise<GradeResult>;
  analyzeCode(
    prompt: string,
    language: string,
    code: string,
    testSummary: { passed: number; total: number; failures: string[] }
  ): Promise<GradeResult>;
  recommendCourses(
    context: CandidateContext,
    scores: { skill: string; score: number | null }[]
  ): Promise<CourseSuggestion[]>;
}
