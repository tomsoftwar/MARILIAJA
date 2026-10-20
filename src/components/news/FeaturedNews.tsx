import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { NewsArticle } from '../../types';

interface FeaturedNewsProps {
  news: NewsArticle;
}

export default function FeaturedNews({ news }: FeaturedNewsProps) {
  return (
    <Link 
      to={`/noticia/${news.id}`} 
      className="block relative group overflow-hidden bg-black border-4 md:border-8 border-black aspect-video md:aspect-[21/9] w-full max-w-full"
    >
      <motion.img
        src={news.imageUrl}
        alt={news.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent group-hover:via-red-700/40 transition-colors duration-500"></div>
      <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-6 md:p-12 w-full max-w-full box-border">
        <span className="bg-[#FF0000] text-white px-2 py-0.5 sm:px-3 sm:py-1 font-black text-[9px] sm:text-xs md:text-sm uppercase mb-2 sm:mb-3 inline-block tracking-wider">
          DESTAQUE • {news.category}
        </span>
        <h2 className="text-white text-base sm:text-2xl md:text-4xl lg:text-5xl font-black leading-tight sm:leading-[0.95] tracking-tight sm:tracking-tighter drop-shadow-2xl md:max-w-5xl uppercase break-words [overflow-wrap:anywhere] line-clamp-3 sm:line-clamp-4 md:line-clamp-none">
          {news.title}
        </h2>
        <div className="hidden md:block mt-4 text-white/90 font-medium text-sm md:text-base lg:text-lg max-w-2xl line-clamp-2 break-words">
          {news.summary}
        </div>
      </div>
    </Link>
  );
}
