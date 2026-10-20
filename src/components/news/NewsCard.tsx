import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import type { NewsArticle } from '../../types';

interface NewsCardProps {
  news: NewsArticle;
}

export default function NewsCard({ news }: NewsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="bg-white flex flex-col h-full border-t-4 border-black pt-2 w-full max-w-full overflow-hidden box-border"
    >
      <div className="category-tag">
        {news.category}
      </div>
      <Link to={`/noticia/${news.id}`} className="relative aspect-video overflow-hidden block mb-3 group w-full">
        <img
          src={news.imageUrl}
          alt={news.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </Link>
      <div className="flex flex-col flex-grow w-full max-w-full overflow-hidden">
        <Link to={`/noticia/${news.id}`} className="hover:text-[#FF0000] transition-colors block w-full">
          <h3 className="text-base sm:text-lg md:text-xl font-black leading-snug sm:leading-none mb-2 tracking-tight sm:tracking-tighter uppercase break-words [overflow-wrap:anywhere]">
            {news.title}
          </h3>
        </Link>
        <p className="text-gray-600 text-xs sm:text-[11px] leading-snug line-clamp-3 font-medium break-words [overflow-wrap:anywhere]">
          {news.summary}
        </p>
      </div>
    </motion.div>
  );
}
