# TalentBridge

Plataforma de recrutamento e desenvolvimento profissional focada em tecnologia e programação. Usa IA para analisar currículos, identificar competências, gerar avaliações personalizadas, pontuar resultados, recomendar cursos e apoiar empresas no processo seletivo.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS v4 (design system Notion-style)
- Prisma + SQLite
- Autenticação por sessão (cookie httpOnly)
- IA com provider plugável (`mock` por padrão; `openai-compat` via env)

## Como rodar

```bash
npm install
cp .env.example .env
npm run db:reset   # cria o banco e popula dados demo
npm run dev
```

Acesse http://localhost:3000

## Logins demo (senha: `demo1234`)

| Perfil    | E-mail                    |
|-----------|---------------------------|
| Candidato | joao@talentbridge.dev     |
| Candidato | maria@talentbridge.dev    |
| Candidato | pedro@talentbridge.dev    |
| Empresa   | empresa@talentbridge.dev  |

## Conceito central

O sistema diferencia **INFORMADO** (declarado pelo candidato no currículo/experiências) de **AVALIADO** (comprovado por testes). Currículo e experiência são contexto para personalizar avaliações — nunca prova automática de competência. A IA apoia a análise; a decisão de contratação é sempre da empresa.

## Estrutura

- `src/app` — páginas e rotas de API (App Router)
- `src/lib/ai` — camada de IA (provider mock + openai-compat)
- `src/lib` — auth, scoring, elegibilidade, parsing de currículo, auditoria
- `prisma/schema.prisma` — modelo de dados
- `PROMPT.txt` — especificação completa do produto + design reference
