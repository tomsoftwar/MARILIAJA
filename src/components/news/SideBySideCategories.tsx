import { Link } from 'react-router-dom';
import { NewsCategory, NewsArticle } from '../../types';
import { ChevronRight, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SideBySideCategoriesProps {
  newsList: NewsArticle[];
}

// Exactly the five categories specified by the user in the specified order:
const SECTION_ORDER = [
  NewsCategory.POLICIA,
  NewsCategory.POLITICA,
  NewsCategory.CIDADE,
  NewsCategory.VARIEDADES,
  NewsCategory.REGIAO
];

const CATEGORY_COLORS: Record<string, string> = {
  [NewsCategory.POLICIA]: '#DC2626', // Red
  [NewsCategory.POLITICA]: '#2563EB', // Blue
  [NewsCategory.CIDADE]: '#16A34A', // Green
  [NewsCategory.VARIEDADES]: '#9333EA', // Purple
  [NewsCategory.REGIAO]: '#D97706', // Amber
};

export default function SideBySideCategories({ newsList }: SideBySideCategoriesProps) {
  const formatDate = (dateVal: any) => {
    try {
      if (!dateVal) return '';
      const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return format(d, "dd 'de' MMM, HH:mm", { locale: ptBR });
    } catch {
      return '';
    }
  };

  return (
    <section 
      id="secoes-lado-a-lado" 
      aria-label="Notícias por Seção: Polícia, Política, Cidade, Variedades, Região"
      className="w-full max-w-full overflow-hidden box-border"
    >
      {/* Editorial Section Super-Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2 border-black flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 bg-[#FF0000] inline-block shrink-0"></span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-black">
            Cadernos de Notícias
          </h2>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:inline">
            | Cobertura Completa Lado a Lado
          </span>
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
          5 Seções Principais
        </span>
      </div>

      {/* 5-Column Side-by-Side Newspaper Grid: POLÍCIA, POLÍTICA, CIDADE, VARIEDADES, REGIÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-start w-full max-w-full">
        {SECTION_ORDER.map((category) => {
          const categoryNews = newsList.filter(n => n.category === category);
          const leadArticle = categoryNews[0];
          const otherArticles = categoryNews.slice(1, 5);
          const accentColor = CATEGORY_COLORS[category] || '#FF0000';

          return (
            <div
              key={category}
              id={`secao-${category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}
              className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden h-full"
            >
              {/* Category Column Header */}
              <div 
                className="px-4 py-3.5 border-t-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between"
                style={{ borderTopColor: accentColor }}
              >
                <Link
                  to={`/categoria/${encodeURIComponent(category)}`}
                  className="group inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-xs shrink-0" 
                    style={{ backgroundColor: accentColor }}
                  />
                  <h3 className="text-sm font-black uppercase tracking-wider text-black group-hover:text-[#FF0000] transition-colors">
                    {category}
                  </h3>
                </Link>

                <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {categoryNews.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                {leadArticle ? (
                  <>
                    {/* Lead Story */}
                    <article className="space-y-2.5 group">
                      {leadArticle.imageUrl && (
                        <Link 
                          to={`/noticia/${leadArticle.id}`} 
                          className="block relative aspect-video overflow-hidden rounded-lg bg-gray-100 border border-gray-200"
                        >
                          <img
                            src={leadArticle.imageUrl}
                            alt={leadArticle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </Link>
                      )}

                      <Link to={`/noticia/${leadArticle.id}`} className="block">
                        <h4 className="text-sm sm:text-base font-black text-black leading-snug group-hover:text-[#FF0000] transition-colors line-clamp-3">
                          {leadArticle.title}
                        </h4>
                      </Link>

                      {leadArticle.summary && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-normal">
                          {leadArticle.summary}
                        </p>
                      )}

                      {leadArticle.createdAt && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-1">
                          <Clock size={11} />
                          <span>{formatDate(leadArticle.createdAt)}</span>
                        </div>
                      )}
                    </article>

                    {/* Secondary Articles List */}
                    {otherArticles.length > 0 && (
                      <div className="pt-3 border-t border-gray-100 space-y-3">
                        {otherArticles.map((item) => (
                          <article key={item.id} className="group">
                            <Link to={`/noticia/${item.id}`} className="block">
                              <h5 className="text-xs font-bold text-gray-900 group-hover:text-[#FF0000] transition-colors line-clamp-2 leading-snug">
                                {item.title}
                              </h5>
                            </Link>
                            {item.createdAt && (
                              <span className="text-[10px] text-gray-400 font-semibold block mt-1">
                                {formatDate(item.createdAt)}
                              </span>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-400 space-y-2">
                    <FileText size={24} className="mx-auto opacity-40" />
                    <p className="text-xs font-medium">Nenhuma notícia nesta seção ainda.</p>
                  </div>
                )}

                {/* Column Footer */}
                <div className="pt-3 border-t border-gray-100 mt-auto">
                  <Link
                    to={`/categoria/${encodeURIComponent(category)}`}
                    className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-black hover:text-[#FF0000] transition-colors"
                  >
                    Ver todas em {category}
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
