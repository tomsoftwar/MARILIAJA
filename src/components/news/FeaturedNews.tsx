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
      className="block relative group overflow-hidden bg-black border-4 md:border-8 border-black aspect-video md:aspect-[21/9]"
    >
      <motion.img
        src={news.imageUrl}
        alt={news.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent group-hover:via-red-700/40 transition-colors duration-500"></div>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
        <span className="bg-[#FF0000] text-white px-3 py-1 font-black text-[10px] md:text-sm uppercase mb-4 inline-block tracking-tighter">
          DESTAQUE • {news.category}
        </span>
        <h2 className="text-white text-3xl md:text-6xl font-black leading-[0.9] tracking-tighter drop-shadow-2xl md:max-w-5xl uppercase">
          {news.title}
        </h2>
        <div className="hidden md:block mt-6 text-white/90 font-medium text-lg max-w-2xl line-clamp-2">
          {news.summary}
        </div>
      </div>
    </Link>
  );
}
