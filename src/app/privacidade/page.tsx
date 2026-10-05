import { PublicNav, PublicFooter } from "@/components/layout/PublicChrome";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-[800px] px-6 py-16">
        <h1 className="text-[36px] font-semibold tracking-[-0.03em]">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-stone">
          Documento demonstrativo do protótipo, alinhado aos princípios da LGPD.
        </p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-graphite">
          <section>
            <h2 className="text-[20px] font-semibold text-black">1. Dados coletados</h2>
            <p className="mt-2">
              Coletamos dados de identificação e contato (nome, e-mail, telefone,
              localização), dados profissionais (formação, experiências,
              projetos, certificações, tecnologias) e o conteúdo do currículo
              enviado. Dados sensíveis não são coletados nem utilizados como
              critério de pontuação ou contratação.
            </p>
          </section>
          <section>
            <h2 className="text-[20px] font-semibold text-black">2. Finalidade</h2>
            <p className="mt-2">
              Os dados são utilizados para análise de currículo por IA, geração
              de avaliações personalizadas, cálculo de pontuações por
              competência, recomendação de cursos e comparação com critérios de
              vagas publicadas por empresas.
            </p>
          </section>
          <section>
            <h2 className="text-[20px] font-semibold text-black">3. Transparência</h2>
            <p className="mt-2">
              O candidato visualiza quais informações foram extraídas do
              currículo, quais competências foram informadas e quais foram
              comprovadas por avaliação. A distinção entre &quot;informado&quot; e
              &quot;avaliado&quot; é sempre explícita.
            </p>
          </section>
          <section>
            <h2 className="text-[20px] font-semibold text-black">4. Compartilhamento</h2>
            <p className="mt-2">
              Empresas visualizam apenas candidatos elegíveis para suas vagas,
              conforme critérios objetivos previamente definidos. Motivos de
              inelegibilidade são registrados internamente para auditoria e não
              são exibidos na lista principal.
            </p>
          </section>
          <section>
            <h2 className="text-[20px] font-semibold text-black">5. Direitos do titular</h2>
            <p className="mt-2">
              O titular pode acessar, corrigir e excluir seus dados a qualquer
              momento pela área do candidato ou pelo contato
              contato@talentbridge.dev.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
