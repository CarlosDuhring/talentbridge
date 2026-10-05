import Link from "next/link";
import { PublicNav, PublicFooter } from "@/components/layout/PublicChrome";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

const AVATAR_COLORS = ["#097fe8", "#f64932", "#ffb110", "#62aef0", "#b18164", "#e89d01", "#02093a"];

function CharacterMark({ color, delay }: { color: string; delay: number }) {
  return (
    <span
      className="animate-pop inline-flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white"
      style={{ borderColor: color, animationDelay: `${delay}ms` }}
      aria-hidden="true"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="4" fill={color} opacity="0.85" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="24"
      viewBox="0 0 48 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 18c6-12 10 6 16-6s10 6 16-6 8 4 12 0"
        stroke="#f64932"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path
        d="M13 1l2.6 8.4L24 13l-8.4 2.6L13 25l-2.6-9.4L2 13l8.4-3.6L13 1z"
        fill="#ffb110"
      />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />

      <main>
        <section className="mx-auto max-w-[1200px] px-6 pb-16 pt-16 md:pt-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 flex items-center gap-3">
              {AVATAR_COLORS.map((c, i) => (
                <CharacterMark key={c} color={c} delay={i * 70} />
              ))}
            </div>
            <h1 className="max-w-4xl text-[42px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[72px] md:tracking-[-2.016px]">
              Competências{" "}
              <span className="inline-block rounded-full bg-[#f6d5b8] px-6 py-1 md:px-8">
                comprovadas
              </span>{" "}
              para contratar em tecnologia.
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-[1.56] text-graphite">
              A TalentBridge usa IA para analisar currículos, gerar avaliações
              personalizadas e transformar resultados em decisões de contratação
              mais seguras. A decisão final continua sendo da empresa.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/cadastro/candidato" size="lg">
                Sou candidato
              </ButtonLink>
              <ButtonLink href="/cadastro/empresa" variant="ghost" size="lg">
                Sou empresa
              </ButtonLink>
            </div>
            <div className="relative mt-14 w-full max-w-4xl">
              <Squiggle className="absolute -left-10 top-8 hidden md:block" />
              <Sparkle className="absolute -right-6 -top-4 hidden md:block animate-float" />
              <div className="rounded-xl border border-black/[0.08] bg-white p-4 shadow-mockup md:p-6">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                    <span className="h-2.5 w-2.5 rounded-full bg-marigold" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#2f9e5f]" />
                  </div>
                  <span className="text-xs text-stone">Painel da empresa — candidatos elegíveis</span>
                </div>
                <div className="mt-4 grid gap-3 text-left md:grid-cols-3">
                  {[
                    { name: "João Pereira", score: 82, skills: "PHP 84 · MySQL 76 · Lógica 88" },
                    { name: "Maria Souza", score: 85, skills: "PHP 91 · MySQL 83 · Laravel 88" },
                    { name: "Pedro Lima", score: 75, skills: "PHP 78 · MySQL 72 · Lógica 81" },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className="rounded-lg border border-black/[0.08] bg-white p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{c.name}</p>
                        <Badge tone={c.score >= 85 ? "green" : "blue"}>{c.score}/100</Badge>
                      </div>
                      <p className="mt-1 text-xs text-graphite">{c.skills}</p>
                      <ProgressBar
                        value={c.score}
                        tone={c.score >= 85 ? "green" : "blue"}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-sky-tint px-3 py-2 text-left text-xs text-notion-blue">
                  Filtro ativo: somente candidatos que atingiram os critérios mínimos da vaga
                  aparecem nesta lista.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[0.06] bg-white py-10">
          <div className="mx-auto max-w-[1200px] px-6">
            <p className="text-center text-xs font-medium uppercase tracking-widest text-black/40">
              Feito para times de tecnologia que valorizam evidência
            </p>
            <div className="mt-6 grid grid-cols-2 items-center gap-6 text-center md:grid-cols-5">
              {["Back-end", "Front-end", "Dados", "DevOps", "Mobile"].map((t) => (
                <span key={t} className="text-lg font-semibold tracking-tight text-black/40">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[48px]">
              Como funciona
            </h2>
            <p className="mt-3 font-serif text-lg text-graphite">
              Um fluxo estruturado em evidências: o currículo informa, a
              avaliação comprova, a IA organiza e a empresa decide.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Currículo analisado por IA",
                body: "Upload em PDF ou DOCX. A IA extrai formação, experiências, tecnologias e competências — tudo marcado como informado, não comprovado.",
                accent: "sky-tint" as const,
              },
              {
                step: "02",
                title: "Avaliação personalizada",
                body: "A IA gera testes de múltipla escolha, abertas e desafios de código no nível do candidato, com correção automática e análise complementar.",
                accent: "marigold" as const,
              },
              {
                step: "03",
                title: "Decisão com evidência",
                body: "A empresa vê apenas candidatos elegíveis, compara pontuações por competência e conduz o processo. A contratação é sempre humana.",
                accent: "midnight" as const,
              },
            ].map((f) => (
              <Card key={f.step} accent={f.accent} className="p-6">
                <span className="text-xs font-semibold opacity-60">{f.step}</span>
                <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.011em]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed opacity-80">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="candidatos" className="border-y border-black/[0.06] bg-white py-20">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 md:grid-cols-2">
            <div>
              <Badge tone="blue">Para candidatos</Badge>
              <h2 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[42px]">
                Prove o que você sabe. Desenvolva o que falta.
              </h2>
              <p className="mt-4 text-graphite">
                Nada de feed de vagas. Aqui você constrói um perfil de
                competências, realiza avaliações personalizadas e recebe um plano
                de desenvolvimento com cursos recomendados.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Perfil com competências informadas e avaliadas, separadas com clareza",
                  "Testes gerados pela IA conforme suas tecnologias e experiência",
                  "Pontuação por competência com explicação de cada contribuição",
                  "Cursos recomendados com motivo, nível e competência relacionada",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-tint text-[11px] font-bold text-notion-blue">
                      ✓
                    </span>
                    <span className="text-graphite">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <ButtonLink href="/cadastro/candidato">Criar perfil de candidato</ButtonLink>
              </div>
            </div>
            <Card className="p-6">
              <p className="text-sm font-medium text-black/60">Relatório do candidato</p>
              <div className="mt-4 space-y-3">
                {[
                  { skill: "JavaScript", score: 91 },
                  { skill: "Lógica de programação", score: 88 },
                  { skill: "PHP", score: 84 },
                  { skill: "MySQL", score: 76 },
                  { skill: "Laravel", score: 72 },
                ].map((s) => (
                  <div key={s.skill}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{s.skill}</span>
                      <span className="tabular-nums text-graphite">{s.score}/100</span>
                    </div>
                    <ProgressBar
                      value={s.score}
                      tone={s.score >= 85 ? "green" : s.score >= 70 ? "blue" : "yellow"}
                      className="mt-1.5"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg bg-[#fff3d6] px-3 py-2.5 text-xs text-[#8a5a00]">
                Ponto a desenvolver: Laravel (72/100) — curso recomendado com
                motivo detalhado.
              </div>
            </Card>
          </div>
        </section>

        <section id="empresas" className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <Card accent="midnight" className="order-2 p-6 md:order-1">
              <p className="text-sm font-medium text-white/60">Vaga — Desenvolvedor PHP Júnior</p>
              <div className="mt-4 space-y-2 text-sm text-white/90">
                <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
                  <span>PHP · obrigatória</span>
                  <span className="tabular-nums">mín. 70</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
                  <span>MySQL · obrigatória</span>
                  <span className="tabular-nums">mín. 70</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
                  <span>Lógica · obrigatória</span>
                  <span className="tabular-nums">mín. 70</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
                  <span>Laravel · desejável</span>
                  <span className="tabular-nums">mín. 60</span>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-marigold px-3 py-2 text-xs font-medium text-black">
                3 candidatos elegíveis · 1 não elegível (registro interno de auditoria)
              </div>
            </Card>
            <div className="order-1 md:order-2">
              <Badge tone="purple">Para empresas</Badge>
              <h2 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[42px]">
                Menos triagem às cegas. Mais evidência técnica.
              </h2>
              <p className="mt-4 text-graphite">
                Descreva a vaga — a IA identifica tecnologias, nível e requisitos.
                Você revisa os critérios, e a plataforma mostra apenas quem
                atingiu os mínimos definidos.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Critérios obrigatórios e desejáveis com pontuação mínima",
                  "Filtro automático: inelegíveis não aparecem na lista principal",
                  "Comparação objetiva entre candidatos elegíveis",
                  "Pipeline com avanço, entrevista, seleção e contratação",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ece9fb] text-[11px] font-bold text-[#5b4bc4]">
                      ✓
                    </span>
                    <span className="text-graphite">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <ButtonLink href="/cadastro/empresa">Criar conta de empresa</ButtonLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-20">
          <Card accent="coral" className="flex flex-col items-center gap-6 p-10 text-center md:p-14">
            <h2 className="max-w-2xl text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-white md:text-[42px]">
              Comece pelo perfil. A evidência vem na sequência.
            </h2>
            <p className="max-w-xl text-sm text-white/85">
              Protótipo funcional com dados fictícios: crie sua conta, envie um
              currículo e veja a IA gerar a avaliação personalizada.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/cadastro/candidato" variant="ghost" size="lg">
                Criar conta de candidato
              </ButtonLink>
              <ButtonLink
                href="/cadastro/empresa"
                variant="text"
                size="lg"
                className="!text-white hover:!bg-white/10"
              >
                Criar conta de empresa
              </ButtonLink>
            </div>
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
