import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NewsCategory, NewsArticle } from '../types';
import { newsService } from '../lib/newsService';
import NewsCard from '../components/news/NewsCard';
import { ArrowLeft, Tag } from 'lucide-react';

export default function CategoryPage() {
  const { category: rawCategory } = useParams<{ category: string }>();
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const decodedCategory = rawCategory ? decodeURIComponent(rawCategory) : '';

  useEffect(() => {
    const unsub = newsService.subscribe((all) => {
      setNewsList(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredNews = newsList.filter(
    (n) => n.category.toLowerCase() === decodedCategory.toLowerCase()
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 overflow-hidden box-border">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4 flex-wrap gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black hover:text-[#FF0000] transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para a Página Inicial
        </Link>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {filteredNews.length} {filteredNews.length === 1 ? 'notícia encontrada' : 'notícias encontradas'}
        </span>
      </div>

      {/* Category Header */}
      <div className="flex items-center gap-3">
        <span className="w-4 h-4 bg-[#FF0000] inline-block shrink-0"></span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-black flex items-center gap-2">
          {decodedCategory || 'Seção'}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF0000]"></div>
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {filteredNews.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-4 border-dashed border-gray-200 rounded-3xl">
          <Tag size={40} className="mx-auto mb-3 text-gray-300" />
          <h2 className="text-xl font-black text-gray-400 uppercase tracking-tight">
            Nenhuma notícia cadastrada nesta categoria
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Novas matérias e atualizações de {decodedCategory} serão publicadas em breve.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block bg-[#FF0000] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
          >
            Ir para Notícias Principais
          </Link>
        </div>
      )}
    </div>
  );
}
