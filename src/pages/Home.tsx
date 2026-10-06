import { useState, useEffect } from 'react';
import { NewsCategory, type NewsArticle } from '../types';
import { newsService } from '../lib/newsService';
import FeaturedNews from '../components/news/FeaturedNews';
import NewsCard from '../components/news/NewsCard';

export default function Home() {
  const [featuredNews, setFeaturedNews] = useState<NewsArticle | null>(null);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to newsService for immediate and real-time updates!
    const unsubscribe = newsService.subscribe((all) => {
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

    return () => unsubscribe();
  }, []);

  const categories = Object.values(NewsCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0000]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-16 max-w-7xl">
      {/* Featured Section */}
      {featuredNews && (
        <section id="featured-section">
          <FeaturedNews news={featuredNews} />
        </section>
      )}

      {/* Categories Grid */}
      <div className="space-y-16">
        {categories.map((category) => {
          const categoryNews = newsList.filter(n => n.category === category);
          if (categoryNews.length === 0) return null;

          return (
            <section key={category} className="border-t-2 border-black pt-6" id={`category-${category.toLowerCase()}`}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#FF0000] inline-block"></span>
                  {category}
                </h2>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {categoryNews.length} {categoryNews.length === 1 ? 'notícia' : 'notícias'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categoryNews.map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
