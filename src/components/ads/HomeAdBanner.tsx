import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowRight, Megaphone, Sparkles, Building2, PhoneCall } from 'lucide-react';

interface HomeAdBannerProps {
  variant: 'top-rect' | 'grid-col' | 'bottom-rect';
  content?: string;
}

export default function HomeAdBanner({ variant, content }: HomeAdBannerProps) {
  const isCustom = Boolean(content && content.trim().length > 0);
  const isImageUrl = isCustom && (
    content!.trim().match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || 
    (content!.startsWith('http') && !content!.includes('<'))
  );

  // 1. TOP RECTANGULAR BANNER
  if (variant === 'top-rect') {
    return (
      <section className="w-full max-w-full overflow-hidden my-4" aria-label="Espaço Publicitário Superior">
        <div className="w-full bg-zinc-950 text-white border-4 border-black p-4 sm:p-5 rounded-2xl relative shadow-md overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-zinc-800">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
              <Megaphone size={11} className="text-[#FF0000]" /> PUBLICIDADE • SUPER BANNER
            </span>
            <Link 
              to="/anuncie" 
              className="text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-white transition-colors"
            >
              Anuncie aqui
            </Link>
          </div>

          {isCustom ? (
            isImageUrl ? (
              <a href="/#/anuncie" className="block w-full">
                <img 
                  src={content} 
                  alt="Publicidade MaríliaJá" 
                  className="w-full h-auto max-h-[140px] object-contain mx-auto rounded"
                  referrerPolicy="no-referrer"
                />
              </a>
            ) : (
              <div 
                className="w-full overflow-hidden flex justify-center py-2"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(content!, {
                    ADD_TAGS: ["iframe", "script"],
                    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src", "async", "charset"]
                  }) 
                }} 
              />
            )
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-[#FF0000] text-white rounded-xl flex items-center justify-center font-black text-xl tracking-tighter shrink-0 shadow">
                  MJ
                </div>
                <div>
                  <h4 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight text-white leading-snug">
                    ANUNCIE SUA MARCA NO PORTAL MARÍLIA JÁ
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 font-medium mt-0.5">
                    O portal mais acessado de Marília e região • Banners de alto impacto e TV Marília Já
                  </p>
                </div>
              </div>

              <Link
                to="/anuncie"
                className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-white hover:text-black text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shrink-0 shadow"
              >
                Anunciar no Portal <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // 2. GRID COLUMN BANNER (Placed right beside REGIÃO in the 3-column layout)
  if (variant === 'grid-col') {
    return (
      <div 
        className="bg-white border-t-4 border-black pt-4 flex flex-col h-full w-full max-w-full overflow-hidden" 
        id="category-publicidade"
      >
        {/* Column Header matching other categories */}
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2 mb-4">
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-black">
            <span className="w-2.5 h-2.5 bg-[#FF0000] inline-block"></span>
            PUBLICIDADE
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#FF0000] px-2 py-0.5 rounded-full">
            ESPAÇO DISPONÍVEL
          </span>
        </div>

        {isCustom ? (
          isImageUrl ? (
            <a href="/#/anuncie" className="block w-full flex-1">
              <img 
                src={content} 
                alt="Publicidade" 
                className="w-full h-auto object-cover rounded-lg border-2 border-black"
                referrerPolicy="no-referrer"
              />
            </a>
          ) : (
            <div 
              className="w-full flex-1 overflow-hidden"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(content!, {
                  ADD_TAGS: ["iframe", "script"],
                  ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src", "async", "charset"]
                }) 
              }} 
            />
          )
        ) : (
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-5 rounded-2xl border-2 border-black flex flex-col justify-between flex-1 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#FF0000] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded mb-3">
                <Sparkles size={11} /> Patrocínio Oficial
              </div>
              <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-snug mb-2">
                Destaque sua Empresa para Toda a Região
              </h4>
              <p className="text-xs text-zinc-300 font-medium leading-relaxed mb-4">
                Milhares de moradores de Marília, Pompeia, Vera Cruz e Garça acessam o portal todos os dias. Coloque seu produto em evidência.
              </p>

              <div className="space-y-1.5 text-[11px] font-bold text-zinc-400 mb-6 border-t border-zinc-800 pt-3">
                <p className="flex items-center gap-2 text-zinc-300">
                  <span className="text-[#FF0000] font-black">✓</span> Banners no Celular e Computador
                </p>
                <p className="flex items-center gap-2 text-zinc-300">
                  <span className="text-[#FF0000] font-black">✓</span> Menção na TV Marília Já
                </p>
                <p className="flex items-center gap-2 text-zinc-300">
                  <span className="text-[#FF0000] font-black">✓</span> Reportagens e Publieditoriais
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <Link
                to="/anuncie"
                className="w-full bg-[#FF0000] hover:bg-white hover:text-black text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow text-center"
              >
                Conhecer Planos <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. BOTTOM RECTANGULAR BANNER (Right above the footer)
  if (variant === 'bottom-rect') {
    return (
      <section className="w-full max-w-full overflow-hidden mt-12 mb-4" aria-label="Espaço Publicitário Inferior">
        <div className="w-full bg-zinc-950 text-white border-4 border-black p-5 sm:p-6 rounded-2xl relative shadow-xl overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-zinc-800">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
              <Building2 size={11} className="text-[#FF0000]" /> PUBLICIDADE • SUPER BANNER RODAPÉ
            </span>
            <Link 
              to="/anuncie" 
              className="text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-white transition-colors"
            >
              Espaço Disponível
            </Link>
          </div>

          {isCustom ? (
            isImageUrl ? (
              <a href="/#/anuncie" className="block w-full">
                <img 
                  src={content} 
                  alt="Publicidade Rodapé" 
                  className="w-full h-auto max-h-[140px] object-contain mx-auto rounded"
                  referrerPolicy="no-referrer"
                />
              </a>
            ) : (
              <div 
                className="w-full overflow-hidden flex justify-center py-2"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(content!, {
                    ADD_TAGS: ["iframe", "script"],
                    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src", "async", "charset"]
                  }) 
                }} 
              />
            )
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-5 py-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-900 border-2 border-zinc-700 text-[#FF0000] rounded-xl flex items-center justify-center shrink-0 shadow">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight text-white leading-snug">
                    SUA EMPRESA EM DESTAQUE NO MAIOR PORTAL DA CIDADE
                  </h4>
                  <p className="text-xs text-zinc-400 font-medium mt-1">
                    Divulgue suas promoções, produtos e lançamentos para milhares de consumidores em Marília e região.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center md:justify-end">
                <Link
                  to="/contato"
                  className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-zinc-800"
                >
                  <PhoneCall size={14} /> Falar Conosco
                </Link>
                <Link
                  to="/anuncie"
                  className="inline-flex items-center gap-2 bg-[#FF0000] hover:bg-white hover:text-black text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow"
                >
                  Anunciar Agora <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}
