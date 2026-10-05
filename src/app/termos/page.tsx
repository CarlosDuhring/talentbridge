import { PublicNav, PublicFooter } from "@/components/layout/PublicChrome";

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-[800px] px-6 py-16">
        <h1 className="text-[36px] font-semibold tracking-[-0.03em]">Termos de Uso</h1>
        <p className="mt-2 text-sm text-stone">
          Documento demonstrativo do protótipo.
        </p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-graphite">
          <section>
            <h2 className="text-[20px] font-semibold text-black">1. Natureza da plataforma</h2>
            <p className="mt-2">
              A TalentBridge é uma ferramenta de análise e apoio à decisão. A IA
              não contrata, não elimina e não seleciona candidatos de forma
              automática. A decisão final é sempre da empresa contratante.
            </p>
          </section>
          <section>
            <h2 className="text-[20px] font-semibold text-black">2. Uso do candidato</h2>
            <p className="mt-2">
              O candidato é responsável pela veracidade das informações
              fornecidas. A plataforma não oferece busca de vagas, feed ou
              candidatura direta: o perfil fica disponível para processos
              compatíveis.
            </p>
          </section>
          <section>
            <h2 className="text-[20px] font-semibold text-black">3. Uso da empresa</h2>
            <p className="mt-2">
              A empresa compromete-se a definir critérios exclusivamente
              técnicos e profissionais, sem utilizar características pessoais
              sensíveis ou critérios discriminatórios.
            </p>
          </section>
          <section>
            <h2 className="text-[20px] font-semibold text-black">4. Avaliações</h2>
            <p className="mt-2">
              As pontuações refletem os resultados das avaliações realizadas e
              são acompanhadas da explicação de quais itens contribuíram para
              cada nota.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
