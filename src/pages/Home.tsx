import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NewsCategory, type NewsArticle } from '../types';
import { newsService } from '../lib/newsService';
import { adService, PortalAdsConfig } from '../lib/adService';
import FeaturedNews from '../components/news/FeaturedNews';
import TvMariliaSection from '../components/home/TvMariliaSection';
import HomeAdBanner from '../components/ads/HomeAdBanner';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Home() {
  const [featuredNews, setFeaturedNews] = useState<NewsArticle | null>(null);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [adsConfig, setAdsConfig] = useState<PortalAdsConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to newsService for immediate and real-time updates!
    const unsubscribeNews = newsService.subscribe((all) => {
      if (all.length > 0) {
        const featured = all.find(n => n.isFeatured) || all[0];
        setFeaturedNews(featured);
        setNewsList(all);
      } else {
        setFeaturedNews(null);
        setNewsList([]);
      }
      setLoading(false);
    });

    // Subscribe to homepage ads configuration
    const unsubscribeAds = adService.subscribe((ads) => {
      setAdsConfig(ads);
    });

    return () => {
      unsubscribeNews();
      unsubscribeAds();
    };
  }, []);

  // Standard ordered categories requested: POLÍCIA, POLÍTICA, CIDADE, VARIEDADES, REGIÃO
  const orderedCategories = [
    NewsCategory.POLICIA,
    NewsCategory.POLITICA,
    NewsCategory.CIDADE,
    NewsCategory.VARIEDADES,
    NewsCategory.REGIAO
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0000]"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 md:py-6 space-y-10 md:space-y-14 overflow-hidden box-border">
      {/* 1. ADS SUPERIOR (Retangular / Leaderboard Banner) */}
      <HomeAdBanner variant="top-rect" content={adsConfig.homeTop} />

      {/* 2. Featured Top Banner */}
      {featuredNews && (
        <section id="featured-section" className="w-full max-w-full overflow-hidden">
          <FeaturedNews news={featuredNews} />
        </section>
      )}

      {/* 3. TV MARÍLIA JÁ (YouTube Videos Section) */}
      <TvMariliaSection />

      {/* 4. Editorial Categories arranged side-by-side in 3 COLUMNS + ADS AO LADO DE REGIÃO */}
      <section className="w-full max-w-full overflow-hidden" id="categories-grid-section">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-3 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-[#FF0000] inline-block"></span>
            Editorias & Notícias
          </h2>
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
            Marília e Região
          </span>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start w-full">
          {/* As 5 editorias: POLÍCIA, POLÍTICA, CIDADE, VARIEDADES, REGIÃO */}
          {orderedCategories.map((category) => {
            const categoryNews = newsList.filter(n => n.category === category);
            const leadArticle = categoryNews[0];
            const otherArticles = categoryNews.slice(1, 4);

            return (
              <div 
                key={category} 
                className="bg-white border-t-4 border-black pt-4 flex flex-col h-full w-full max-w-full overflow-hidden"
                id={`category-${category.toLowerCase().replace(/í|í/g, 'i')}`}
              >
                {/* Category Column Header */}
                <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2 mb-4">
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-black">
                    <span className="w-2.5 h-2.5 bg-[#FF0000] inline-block"></span>
                    {category}
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {categoryNews.length} {categoryNews.length === 1 ? 'matéria' : 'matérias'}
                  </span>
                </div>

                {/* Lead Article in this Column */}
                {leadArticle ? (
                  <div className="flex flex-col flex-1">
                    <Link 
                      to={`/noticia/${leadArticle.id}`} 
                      className="block relative aspect-video overflow-hidden rounded-lg border-2 border-black mb-3 group w-full"
                    >
                      <img 
                        src={leadArticle.imageUrl} 
                        alt={leadArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </Link>

                    <Link 
                      to={`/noticia/${leadArticle.id}`}
                      className="hover:text-[#FF0000] transition-colors"
                    >
                      <h4 className="text-base sm:text-lg font-black uppercase tracking-tight leading-snug break-words line-clamp-3 mb-2">
                        {leadArticle.title}
                      </h4>
                    </Link>

                    <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed mb-3 break-words">
                      {leadArticle.summary}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-4">
                      <Clock size={11} />
                      <span>
                        {leadArticle.createdAt ? format(new Date(leadArticle.createdAt), "dd/MM/yyyy", { locale: ptBR }) : ''}
                      </span>
                      {leadArticle.authorSignature && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="truncate max-w-[120px]">{leadArticle.authorSignature}</span>
                        </>
                      )}
                    </div>

                    {/* Secondary Articles in this Category */}
                    {otherArticles.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-gray-100 mt-auto">
                        {otherArticles.map((item) => (
                          <Link 
                            key={item.id}
                            to={`/noticia/${item.id}`}
                            className="flex items-start gap-2.5 group hover:bg-gray-50 p-1.5 rounded-lg transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-16 h-12 object-cover rounded border border-black shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-black uppercase tracking-tight line-clamp-2 leading-snug group-hover:text-[#FF0000] transition-colors break-words">
                                {item.title}
                              </h5>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 block">
                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM", { locale: ptBR }) : ''}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                      Em breve notícias em {category}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* 5. ESPAÇO PUBLICITÁRIO AO LADO DA SEÇÃO REGIÃO (Coluna 3 da 2ª linha da grade) */}
          <HomeAdBanner variant="grid-col" content={adsConfig.homeGrid} />
        </div>
      </section>

      {/* 6. ADS INFERIOR (Retangular / Super Banner logo acima do rodapé) */}
      <HomeAdBanner variant="bottom-rect" content={adsConfig.homeBottom} />
    </div>
  );
}
