import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SKILLS: { name: string; category: string }[] = [
  { name: "PHP", category: "LINGUAGEM" },
  { name: "JavaScript", category: "LINGUAGEM" },
  { name: "TypeScript", category: "LINGUAGEM" },
  { name: "Python", category: "LINGUAGEM" },
  { name: "Java", category: "LINGUAGEM" },
  { name: "SQL", category: "BANCO_DE_DADOS" },
  { name: "MySQL", category: "BANCO_DE_DADOS" },
  { name: "PostgreSQL", category: "BANCO_DE_DADOS" },
  { name: "MongoDB", category: "BANCO_DE_DADOS" },
  { name: "Laravel", category: "FRAMEWORK" },
  { name: "React", category: "FRAMEWORK" },
  { name: "Next.js", category: "FRAMEWORK" },
  { name: "Node.js", category: "FRAMEWORK" },
  { name: "Vue.js", category: "FRAMEWORK" },
  { name: "Django", category: "FRAMEWORK" },
  { name: "Spring Boot", category: "FRAMEWORK" },
  { name: "Bootstrap", category: "FRAMEWORK" },
  { name: "Tailwind CSS", category: "FRAMEWORK" },
  { name: "Git", category: "FERRAMENTA" },
  { name: "Docker", category: "FERRAMENTA" },
  { name: "Kubernetes", category: "FERRAMENTA" },
  { name: "AWS", category: "FERRAMENTA" },
  { name: "Linux", category: "FERRAMENTA" },
  { name: "REST APIs", category: "FUNDAMENTO" },
  { name: "Lógica de programação", category: "FUNDAMENTO" },
  { name: "Estruturas de dados", category: "FUNDAMENTO" },
  { name: "POO", category: "FUNDAMENTO" },
  { name: "Testes automatizados", category: "FUNDAMENTO" },
  { name: "HTML", category: "FUNDAMENTO" },
  { name: "CSS", category: "FUNDAMENTO" },
  { name: "Scrum", category: "OUTRO" },
  { name: "Comunicação", category: "SOFT_SKILL" },
  { name: "Trabalho em equipe", category: "SOFT_SKILL" },
];

const COURSES: {
  skill: string;
  title: string;
  provider: string;
  level: string;
  hours: number;
  url: string;
}[] = [
  { skill: "PHP", title: "PHP: do básico ao avançado", provider: "Alura", level: "Intermediário", hours: 40, url: "https://www.alura.com.br/cursos-online-programacao/php" },
  { skill: "MySQL", title: "MySQL: consultas e modelagem de dados", provider: "Alura", level: "Intermediário", hours: 30, url: "https://www.alura.com.br/cursos-online-banco-de-dados/mysql" },
  { skill: "Laravel", title: "Laravel: desenvolvimento web profissional", provider: "Udemy", level: "Intermediário", hours: 45, url: "https://www.udemy.com/topic/laravel/" },
  { skill: "JavaScript", title: "JavaScript moderno: fundamentos e prática", provider: "freeCodeCamp", level: "Intermediário", hours: 50, url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/" },
  { skill: "Docker", title: "Docker para desenvolvedores", provider: "Udemy", level: "Iniciante", hours: 20, url: "https://www.udemy.com/topic/docker/" },
  { skill: "Git", title: "Git e GitHub: controle de versão na prática", provider: "Alura", level: "Iniciante", hours: 12, url: "https://www.alura.com.br/curso-online-git-github-controle-de-versao" },
  { skill: "Lógica de programação", title: "Lógica de programação com exercícios", provider: "freeCodeCamp", level: "Iniciante", hours: 25, url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/" },
  { skill: "Python", title: "Python para todos", provider: "Coursera", level: "Iniciante", hours: 35, url: "https://www.coursera.org/specializations/python" },
  { skill: "Java", title: "Java completo: orientação a objetos", provider: "Udemy", level: "Intermediário", hours: 60, url: "https://www.udemy.com/topic/java/" },
  { skill: "React", title: "React: construindo interfaces modernas", provider: "Alura", level: "Intermediário", hours: 40, url: "https://www.alura.com.br/cursos-online-front-end/react" },
  { skill: "REST APIs", title: "APIs REST: design e boas práticas", provider: "Alura", level: "Intermediário", hours: 20, url: "https://www.alura.com.br/cursos-online-programacao/apis" },
  { skill: "Testes automatizados", title: "Testes automatizados: TDD na prática", provider: "Udemy", level: "Intermediário", hours: 25, url: "https://www.udemy.com/topic/tdd/" },
  { skill: "PostgreSQL", title: "PostgreSQL: do zero ao avançado", provider: "Udemy", level: "Intermediário", hours: 35, url: "https://www.udemy.com/topic/postgresql/" },
  { skill: "Node.js", title: "Node.js: APIs escaláveis", provider: "Alura", level: "Intermediário", hours: 40, url: "https://www.alura.com.br/cursos-online-programacao/node-js" },
  { skill: "TypeScript", title: "TypeScript: tipagem estática na prática", provider: "Alura", level: "Intermediário", hours: 30, url: "https://www.alura.com.br/curso-online-typescript" },
  { skill: "AWS", title: "AWS Certified Cloud Practitioner", provider: "Coursera", level: "Iniciante", hours: 30, url: "https://www.coursera.org/professional-certificates/aws-cloud-practitioner" },
  { skill: "POO", title: "Orientação a objetos: conceitos e prática", provider: "Alura", level: "Intermediário", hours: 25, url: "https://www.alura.com.br/cursos-online-programacao/orientacao-a-objetos" },
  { skill: "Estruturas de dados", title: "Estruturas de dados e algoritmos", provider: "Coursera", level: "Intermediário", hours: 45, url: "https://www.coursera.org/learn/algorithms-part1" },
];

async function main() {
  console.log("Limpando banco...");
  await prisma.auditLog.deleteMany();
  await prisma.jobCandidate.deleteMany();
  await prisma.jobAnalysis.deleteMany();
  await prisma.jobRequirement.deleteMany();
  await prisma.job.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.courseRecommendation.deleteMany();
  await prisma.course.deleteMany();
  await prisma.skillScore.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.assessmentItem.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.candidateSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.resumeAnalysis.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.project.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.education.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log("Criando skills e cursos...");
  const skillMap = new Map<string, string>();
  for (const s of SKILLS) {
    const created = await prisma.skill.create({ data: s });
    skillMap.set(s.name, created.id);
  }
  for (const c of COURSES) {
    await prisma.course.create({
      data: {
        title: c.title,
        provider: c.provider,
        level: c.level,
        hours: c.hours,
        url: c.url,
        skillId: skillMap.get(c.skill)!,
      },
    });
  }

  const password = await bcrypt.hash("demo1234", 10);

  console.log("Criando empresa...");
  const companyUser = await prisma.user.create({
    data: {
      email: "empresa@talentbridge.dev",
      passwordHash: password,
      role: "COMPANY",
      name: "TechNova Recrutamento",
      emailVerified: true,
    },
  });
  const company = await prisma.companyProfile.create({
    data: {
      userId: companyUser.id,
      tradeName: "TechNova Sistemas",
      sector: "Desenvolvimento de software",
      location: "Joinville, SC",
      website: "https://technova.example.com",
      description:
        "Empresa de desenvolvimento de sistemas web para o setor logístico, com times de produto e engenharia.",
    },
  });

  console.log("Criando candidatos...");

  type CandidateSeed = {
    email: string;
    name: string;
    phone: string;
    location: string;
    headline: string;
    objective: string;
    github: string;
    portfolio: string;
    educations: { institution: string; course: string; level: string; startYear: number; endYear: number; status: string }[];
    certifications: { name: string; issuer: string; year: number }[];
    experiences: { company: string; role: string; startDate: string; endDate?: string; current: boolean; description: string; technologies: string; registered: boolean }[];
    projects: { name: string; description: string; technologies: string; repo: string }[];
    informedSkills: { name: string; evidence: string }[];
    scores: { skill: string; score: number; breakdown: string }[];
    resumeText: string;
    recommendations: { skill: string; reason: string; priority: number }[];
  };

  function originFor(skill: string, c: CandidateSeed): string {
    const has = (techs: string) =>
      techs
        .split(",")
        .map((t) => t.trim())
        .includes(skill);
    if (c.experiences.some((e) => has(e.technologies))) return "EXPERIENCIA";
    if (c.projects.some((p) => has(p.technologies))) return "PROJETO";
    return "CURRICULO";
  }

  const candidates: CandidateSeed[] = [
    {
      email: "joao@talentbridge.dev",
      name: "João Pereira",
      phone: "(47) 99911-2233",
      location: "Joinville, SC",
      headline: "Desenvolvedor PHP",
      objective: "Atuar como desenvolvedor back-end PHP em produtos de logística.",
      github: "https://github.com/joaopereira-dev",
      portfolio: "https://joaopereira.dev",
      educations: [
        { institution: "SENAI Joinville", course: "Técnico em Desenvolvimento de Sistemas", level: "TÉCNICO", startYear: 2019, endYear: 2021, status: "CONCLUIDO" },
      ],
      certifications: [
        { name: "PHP Fundamentals", issuer: "Alura", year: 2022 },
        { name: "MySQL para Desenvolvedores", issuer: "Udemy", year: 2023 },
      ],
      experiences: [
        {
          company: "LogiSoft Sistemas",
          role: "Desenvolvedor PHP",
          startDate: "2022-03-01",
          current: true,
          description:
            "Desenvolvimento e manutenção de sistema de gestão de frotas em PHP e Laravel, com integrações REST e banco MySQL.",
          technologies: "PHP, Laravel, MySQL, Git, REST APIs",
          registered: true,
        },
        {
          company: "Agência WebSul",
          role: "Estagiário de Desenvolvimento",
          startDate: "2021-02-01",
          endDate: "2022-02-28",
          current: false,
          description: "Manutenção de sites institucionais em PHP e WordPress.",
          technologies: "PHP, MySQL, JavaScript, HTML, CSS",
          registered: true,
        },
      ],
      projects: [
        {
          name: "API de Rastreamento de Entregas",
          description: "API REST em Laravel para rastreamento de entregas em tempo real, com autenticação por token.",
          technologies: "PHP, Laravel, MySQL, REST APIs",
          repo: "https://github.com/joaopereira-dev/rastreio-api",
        },
        {
          name: "Painel de Frotas",
          description: "Dashboard web para gestão de veículos e motoristas.",
          technologies: "PHP, JavaScript, Bootstrap, MySQL",
          repo: "https://github.com/joaopereira-dev/painel-frotas",
        },
      ],
      informedSkills: [
        { name: "PHP", evidence: "2 anos como desenvolvedor PHP na LogiSoft" },
        { name: "Laravel", evidence: "Sistema de gestão de frotas em Laravel" },
        { name: "MySQL", evidence: "Modelagem e consultas no sistema de frotas" },
        { name: "JavaScript", evidence: "Interfaces do painel de frotas" },
        { name: "Git", evidence: "Controle de versão nos projetos" },
        { name: "REST APIs", evidence: "API de rastreamento de entregas" },
        { name: "Lógica de programação", evidence: "Formação técnica e prática diária" },
        { name: "Comunicação", evidence: "Comunicação com time e clientes nos projetos" },
        { name: "Trabalho em equipe", evidence: "Atuação em squad de produto na LogiSoft" },
      ],
      scores: [
        { skill: "PHP", score: 84, breakdown: "Múltipla escolha: 100/100 · Aberta: 78/100 · Código: 80/100" },
        { skill: "MySQL", score: 76, breakdown: "Múltipla escolha: 50/100 · Aberta: 82/100 · Código: 88/100" },
        { skill: "JavaScript", score: 91, breakdown: "Múltipla escolha: 100/100 · Aberta: 85/100 · Código: 90/100" },
        { skill: "Lógica de programação", score: 88, breakdown: "Múltipla escolha: 100/100 · Aberta: 76/100" },
        { skill: "Laravel", score: 72, breakdown: "Múltipla escolha: 50/100 · Aberta: 74/100 · Código: 92/100" },
        { skill: "Git", score: 80, breakdown: "Múltipla escolha: 100/100 · Aberta: 60/100" },
      ],
      resumeText: `João Pereira
Desenvolvedor PHP
Joinville, SC | (47) 99911-2233 | joao@talentbridge.dev

Formação
Técnico em Desenvolvimento de Sistemas — SENAI Joinville (2019-2021)

Experiência
Desenvolvedor PHP — LogiSoft Sistemas (2022 - atual)
Desenvolvimento de sistema de gestão de frotas em PHP, Laravel e MySQL.
Estagiário de Desenvolvimento — Agência WebSul (2021-2022)
Manutenção de sites em PHP, JavaScript, HTML e CSS.

Tecnologias
PHP, Laravel, MySQL, JavaScript, Git, REST APIs

Habilidades
Comunicação, Trabalho em equipe

Certificações
PHP Fundamentals — Alura (2022)
MySQL para Desenvolvedores — Udemy (2023)

Projetos
API de Rastreamento de Entregas — Laravel, MySQL
Painel de Frotas — PHP, JavaScript, Bootstrap`,
      recommendations: [
        { skill: "Laravel", reason: "Sua avaliação de Laravel foi 72/100. Recomendado para reforçar as lacunas identificadas nos testes.", priority: 1 },
        { skill: "MySQL", reason: "Sua avaliação de MySQL foi 76/100, com dificuldade em consultas com agregação. Recomendado para consolidar a base.", priority: 2 },
      ],
    },
    {
      email: "maria@talentbridge.dev",
      name: "Maria Souza",
      phone: "(47) 98822-4455",
      location: "Florianópolis, SC",
      headline: "Desenvolvedora Full Stack",
      objective: "Trabalhar com desenvolvimento full stack em produtos SaaS.",
      github: "https://github.com/mariasouza-dev",
      portfolio: "https://mariasouza.dev",
      educations: [
        { institution: "UFSC", course: "Bacharelado em Sistemas de Informação", level: "GRADUAÇÃO", startYear: 2018, endYear: 2022, status: "CONCLUIDO" },
      ],
      certifications: [
        { name: "AWS Cloud Practitioner", issuer: "AWS", year: 2023 },
        { name: "Scrum Fundamentals", issuer: "Scrum Alliance", year: 2022 },
      ],
      experiences: [
        {
          company: "SaaSFlow",
          role: "Desenvolvedora Full Stack",
          startDate: "2022-06-01",
          current: true,
          description:
            "Desenvolvimento de plataforma SaaS em PHP/Laravel no back-end e React no front-end, com PostgreSQL e Docker.",
          technologies: "PHP, Laravel, React, PostgreSQL, Docker, Git, AWS",
          registered: true,
        },
        {
          company: "DataMinds",
          role: "Desenvolvedora Júnior",
          startDate: "2021-01-01",
          endDate: "2022-05-31",
          current: false,
          description: "APIs REST em PHP e integrações com serviços externos.",
          technologies: "PHP, MySQL, REST APIs, Git",
          registered: true,
        },
      ],
      projects: [
        {
          name: "Plataforma de Assinaturas",
          description: "SaaS multi-tenant com cobrança recorrente e painel administrativo.",
          technologies: "PHP, Laravel, React, PostgreSQL, Docker",
          repo: "https://github.com/mariasouza-dev/assinaturas",
        },
        {
          name: "Dashboard Analítico",
          description: "Painel com gráficos e relatórios em tempo real.",
          technologies: "React, TypeScript, Node.js",
          repo: "https://github.com/mariasouza-dev/dashboard-analitico",
        },
      ],
      informedSkills: [
        { name: "PHP", evidence: "3 anos de experiência profissional" },
        { name: "Laravel", evidence: "Plataforma SaaS multi-tenant" },
        { name: "React", evidence: "Front-end da plataforma SaaS" },
        { name: "PostgreSQL", evidence: "Banco da plataforma SaaS" },
        { name: "Docker", evidence: "Ambientes de desenvolvimento e deploy" },
        { name: "AWS", evidence: "Deploy em EC2 e S3" },
        { name: "Git", evidence: "Fluxo de branches e code review" },
        { name: "Lógica de programação", evidence: "Formação em Sistemas de Informação" },
        { name: "MySQL", evidence: "Experiência na DataMinds" },
        { name: "REST APIs", evidence: "APIs em PHP" },
        { name: "Comunicação", evidence: "Apresentações de sprint e alinhamento com stakeholders" },
        { name: "Trabalho em equipe", evidence: "Code reviews e pareamento no time SaaSFlow" },
      ],
      scores: [
        { skill: "PHP", score: 91, breakdown: "Múltipla escolha: 100/100 · Aberta: 88/100 · Código: 88/100" },
        { skill: "MySQL", score: 83, breakdown: "Múltipla escolha: 100/100 · Aberta: 80/100 · Código: 72/100" },
        { skill: "JavaScript", score: 86, breakdown: "Múltipla escolha: 100/100 · Aberta: 82/100 · Código: 78/100" },
        { skill: "Lógica de programação", score: 79, breakdown: "Múltipla escolha: 50/100 · Aberta: 92/100" },
        { skill: "Laravel", score: 88, breakdown: "Múltipla escolha: 100/100 · Aberta: 84/100 · Código: 82/100" },
        { skill: "Docker", score: 74, breakdown: "Múltipla escolha: 50/100 · Aberta: 86/100" },
        { skill: "Git", score: 85, breakdown: "Múltipla escolha: 100/100 · Aberta: 70/100" },
      ],
      resumeText: `Maria Souza
Desenvolvedora Full Stack
Florianópolis, SC | (47) 98822-4455 | maria@talentbridge.dev

Formação
Bacharelado em Sistemas de Informação — UFSC (2018-2022)

Experiência
Desenvolvedora Full Stack — SaaSFlow (2022 - atual)
Plataforma SaaS em PHP, Laravel, React, PostgreSQL e Docker.
Desenvolvedora Júnior — DataMinds (2021-2022)
APIs REST em PHP e MySQL.

Tecnologias
PHP, Laravel, React, PostgreSQL, MySQL, Docker, AWS, Git, REST APIs

Habilidades
Comunicação, Trabalho em equipe

Certificações
AWS Cloud Practitioner (2023)
Scrum Fundamentals (2022)`,
      recommendations: [
        { skill: "Docker", reason: "Sua avaliação de Docker foi 74/100. Recomendado para consolidar conceitos de containers e orquestração.", priority: 2 },
      ],
    },
    {
      email: "pedro@talentbridge.dev",
      name: "Pedro Lima",
      phone: "(41) 97733-6677",
      location: "Curitiba, PR",
      headline: "Desenvolvedor Back-end",
      objective: "Crescer como desenvolvedor back-end com foco em PHP e boas práticas.",
      github: "https://github.com/pedrolima-dev",
      portfolio: "",
      educations: [
        { institution: "UTFPR", course: "Tecnólogo em Análise e Desenvolvimento de Sistemas", level: "GRADUAÇÃO", startYear: 2020, endYear: 2022, status: "CONCLUIDO" },
      ],
      certifications: [{ name: "Git e GitHub", issuer: "Alura", year: 2022 }],
      experiences: [
        {
          company: "WebCommerce",
          role: "Desenvolvedor PHP Júnior",
          startDate: "2022-08-01",
          current: true,
          description:
            "Manutenção de e-commerce em PHP e MySQL, correção de bugs e pequenas features.",
          technologies: "PHP, MySQL, JavaScript, Git",
          registered: true,
        },
      ],
      projects: [
        {
          name: "Sistema de Estoque",
          description: "CRUD de produtos com relatórios em PHP e MySQL.",
          technologies: "PHP, MySQL, Bootstrap",
          repo: "https://github.com/pedrolima-dev/estoque",
        },
      ],
      informedSkills: [
        { name: "PHP", evidence: "1,5 ano como desenvolvedor PHP" },
        { name: "MySQL", evidence: "Banco do e-commerce" },
        { name: "JavaScript", evidence: "Validações e interações no front-end" },
        { name: "Git", evidence: "Controle de versão" },
        { name: "Lógica de programação", evidence: "Formação tecnóloga" },
        { name: "Comunicação", evidence: "Alinhamento de tarefas com o time de e-commerce" },
        { name: "Trabalho em equipe", evidence: "Apoio ao time em correções de bugs" },
      ],
      scores: [
        { skill: "PHP", score: 78, breakdown: "Múltipla escolha: 50/100 · Aberta: 84/100 · Código: 92/100" },
        { skill: "MySQL", score: 72, breakdown: "Múltipla escolha: 50/100 · Aberta: 78/100 · Código: 80/100" },
        { skill: "JavaScript", score: 70, breakdown: "Múltipla escolha: 50/100 · Aberta: 72/100 · Código: 82/100" },
        { skill: "Lógica de programação", score: 81, breakdown: "Múltipla escolha: 100/100 · Aberta: 62/100" },
        { skill: "Git", score: 75, breakdown: "Múltipla escolha: 50/100 · Aberta: 80/100" },
      ],
      resumeText: `Pedro Lima
Desenvolvedor Back-end
Curitiba, PR | (41) 97733-6677 | pedro@talentbridge.dev

Formação
Tecnólogo em Análise e Desenvolvimento de Sistemas — UTFPR (2020-2022)

Experiência
Desenvolvedor PHP Júnior — WebCommerce (2022 - atual)
Manutenção de e-commerce em PHP e MySQL.

Tecnologias
PHP, MySQL, JavaScript, Git

Habilidades
Comunicação, Trabalho em equipe

Projetos
Sistema de Estoque — PHP, MySQL, Bootstrap`,
      recommendations: [
        { skill: "MySQL", reason: "Sua avaliação de MySQL foi 72/100. Recomendado para reforçar consultas e modelagem.", priority: 1 },
        { skill: "JavaScript", reason: "Sua avaliação de JavaScript foi 70/100. Recomendado para consolidar fundamentos.", priority: 1 },
        { skill: "Laravel", reason: "Laravel consta como desejável nas vagas compatíveis, mas ainda não foi avaliado. Estude e realize a avaliação.", priority: 3 },
      ],
    },
  ];

  const candidateIds: string[] = [];

  for (const c of candidates) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: password,
        role: "CANDIDATE",
        name: c.name,
        emailVerified: true,
      },
    });
    const profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        phone: c.phone,
        location: c.location,
        headline: c.headline,
        objective: c.objective,
        github: c.github,
        portfolio: c.portfolio || null,
      },
    });
    candidateIds.push(profile.id);

    for (const e of c.educations) {
      await prisma.education.create({ data: { candidateId: profile.id, ...e } });
    }
    for (const cert of c.certifications) {
      await prisma.certification.create({ data: { candidateId: profile.id, ...cert } });
    }
    for (const exp of c.experiences) {
      await prisma.experience.create({ data: { candidateId: profile.id, ...exp } });
    }
    for (const p of c.projects) {
      await prisma.project.create({ data: { candidateId: profile.id, ...p } });
    }

    const resume = await prisma.resume.create({
      data: {
        candidateId: profile.id,
        fileName: `${c.name.toLowerCase().replace(/\s+/g, "-")}-curriculo.pdf`,
        fileType: "PDF",
        rawText: c.resumeText,
      },
    });
    await prisma.resumeAnalysis.create({
      data: {
        resumeId: resume.id,
        provider: "mock",
        data: JSON.stringify({
          name: c.name,
          headline: c.headline,
          summary: `Perfil com ${c.informedSkills.length} tecnologias identificadas e ${c.experiences.length} experiência(s) profissional(is).`,
          education: c.educations,
          courses: [],
          experiences: c.experiences.map((e) => ({
            company: e.company,
            role: e.role,
            startDate: e.startDate,
            endDate: e.endDate,
            current: e.current,
            technologies: e.technologies.split(", "),
          })),
          projects: c.projects.map((p) => ({
            name: p.name,
            description: p.description,
            technologies: p.technologies.split(", "),
          })),
          certifications: c.certifications,
          skills: c.informedSkills.map((s) => ({
            name: s.name,
            category: SKILLS.find((k) => k.name === s.name)?.category ?? "OUTRO",
            evidence: s.evidence,
          })),
        }),
      },
    });

    for (const s of c.informedSkills) {
      await prisma.candidateSkill.create({
        data: {
          candidateId: profile.id,
          skillId: skillMap.get(s.name)!,
          source: "INFORMED",
          origin: originFor(s.name, c),
          evidence: s.evidence,
        },
      });
    }

    for (const s of c.scores) {
      await prisma.skillScore.create({
        data: {
          candidateId: profile.id,
          skillId: skillMap.get(s.skill)!,
          score: s.score,
          source: "ASSESSED",
          breakdown: s.breakdown,
        },
      });
      await prisma.candidateSkill.create({
        data: {
          candidateId: profile.id,
          skillId: skillMap.get(s.skill)!,
          source: "ASSESSED",
          origin: "TESTE",
        },
      });
    }

    const assessment = await prisma.assessment.create({
      data: {
        candidateId: profile.id,
        title: `Avaliação personalizada — ${c.name}`,
        status: "COMPLETED",
        level: c.experiences.length > 1 ? "Pleno" : "Júnior",
        provider: "mock",
        completedAt: new Date(),
      },
    });

    let order = 0;
    for (const s of c.scores) {
      const skillId = skillMap.get(s.skill)!;
      const mcq = await prisma.assessmentItem.create({
        data: {
          assessmentId: assessment.id,
          skillId,
          type: "MULTIPLE_CHOICE",
          prompt: `Questão de múltipla escolha sobre ${s.skill}.`,
          options: JSON.stringify(["Alternativa correta", "Alternativa B", "Alternativa C", "Alternativa D"]),
          correctIndex: 0,
          order: order++,
        },
      });
      await prisma.assessmentResponse.create({
        data: {
          itemId: mcq.id,
          answer: "0",
          score: s.score >= 80 ? 100 : 50,
          feedback: s.score >= 80 ? "Resposta correta." : "Resposta incorreta.",
        },
      });
      const open = await prisma.assessmentItem.create({
        data: {
          assessmentId: assessment.id,
          skillId,
          type: "OPEN",
          prompt: `Explique como você aplicaria ${s.skill} em um projeto real.`,
          rubric: `Demonstrar domínio conceitual e aplicação prática de ${s.skill}.`,
          order: order++,
        },
      });
      await prisma.assessmentResponse.create({
        data: {
          itemId: open.id,
          answer: `Resposta demonstrando aplicação prática de ${s.skill} com exemplo de projeto.`,
          score: Math.min(100, s.score + 4),
          feedback: "Resposta adequada com exemplo prático.",
        },
      });
    }

    for (const r of c.recommendations) {
      const course = await prisma.course.findFirst({
        where: { skillId: skillMap.get(r.skill)! },
      });
      if (course) {
        await prisma.courseRecommendation.create({
          data: {
            candidateId: profile.id,
            courseId: course.id,
            reason: r.reason,
            priority: r.priority,
          },
        });
      }
    }
  }

  console.log("Criando vaga...");
  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      title: "Desenvolvedor PHP Júnior",
      description: `Buscamos Desenvolvedor PHP Júnior para integrar o time de produto.

Requisitos obrigatórios:
- PHP
- MySQL
- Git
- Lógica de programação

Diferenciais:
- Laravel
- JavaScript

Experiência mínima: 1 ano.
Pontuação mínima: 70/100.`,
      level: "Júnior",
      location: "Joinville, SC (Híbrido)",
      minExperienceYears: 1,
      minOverallScore: 70,
      status: "OPEN",
    },
  });

  const requirements: { skill: string; kind: string; minScore: number }[] = [
    { skill: "PHP", kind: "MANDATORY", minScore: 70 },
    { skill: "MySQL", kind: "MANDATORY", minScore: 70 },
    { skill: "Git", kind: "MANDATORY", minScore: 70 },
    { skill: "Lógica de programação", kind: "MANDATORY", minScore: 70 },
    { skill: "Laravel", kind: "DESIRABLE", minScore: 60 },
    { skill: "JavaScript", kind: "DESIRABLE", minScore: 60 },
  ];
  for (const r of requirements) {
    await prisma.jobRequirement.create({
      data: {
        jobId: job.id,
        skillId: skillMap.get(r.skill)!,
        kind: r.kind,
        minScore: r.minScore,
      },
    });
  }

  await prisma.jobAnalysis.create({
    data: {
      jobId: job.id,
      provider: "mock",
      data: JSON.stringify({
        title: job.title,
        level: "Júnior",
        summary:
          "Vaga de Desenvolvedor PHP Júnior com 4 competências obrigatórias e 2 desejáveis identificadas automaticamente.",
        technologies: ["PHP", "MySQL", "Git", "Lógica de programação", "Laravel", "JavaScript"],
        mandatory: requirements.filter((r) => r.kind === "MANDATORY"),
        desirable: requirements.filter((r) => r.kind === "DESIRABLE"),
        minExperienceYears: 1,
        minOverallScore: 70,
      }),
    },
  });

  console.log("Avaliando elegibilidade...");
  const { refreshJobCandidates } = await import("../src/lib/eligibility");
  await refreshJobCandidates(job.id);

  const eligible = await prisma.jobCandidate.count({ where: { jobId: job.id, eligible: true } });
  console.log(`Seed concluído. Candidatos elegíveis para a vaga: ${eligible}`);
  console.log("Logins demo (senha: demo1234):");
  console.log("  Candidato: joao@talentbridge.dev");
  console.log("  Candidato: maria@talentbridge.dev");
  console.log("  Candidato: pedro@talentbridge.dev");
  console.log("  Empresa:   empresa@talentbridge.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
