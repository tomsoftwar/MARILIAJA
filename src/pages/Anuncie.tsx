export default function Anuncie() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-5xl font-black text-[#FF0000] mb-8 tracking-tighter uppercase">ANUNCIE NO MJ</h1>
      <div className="prose prose-lg prose-red max-w-none">
        <p className="text-2xl font-bold">
          Destaque sua marca para milhares de leitores diários em Marília e Região!
        </p>
        <h2 className="text-black font-black uppercase">Por que anunciar no MARÍLIAJÁ?</h2>
        <ul className="space-y-4">
          <li><strong>Audiência Qualificada:</strong> Leitores interessados no que acontece na nossa cidade.</li>
          <li><strong>Alta Visibilidade:</strong> Banner em posições estratégicas (topo, lateral e meio de notícias).</li>
          <li><strong>Custo-Benefício:</strong> Planos que cabem no seu orçamento, com resultados mensuráveis.</li>
          <li><strong>Credibilidade:</strong> Sua marca associada ao portal de notícias mais tradicional da região.</li>
        </ul>
        <div className="bg-gray-100 p-8 rounded-2xl border-l-[12px] border-[#FF0000] mt-12 shadow-inner">
          <h3 className="mt-0 text-black font-black uppercase">Interessado?</h3>
          <p>Entre em contato conosco para solicitar nosso Media Kit atualizado e conhecer nossas opções de publicidade nativa e banners.</p>
          <p className="text-3xl font-black text-black mt-4">Email: comercial@mariliaja.com.br</p>
        </div>
      </div>
    </div>
  );
}
