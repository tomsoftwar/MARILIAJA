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
      className="bg-white flex flex-col h-full border-t-4 border-black pt-2"
    >
      <div className="category-tag">
        {news.category}
      </div>
      <Link to={`/noticia/${news.id}`} className="relative aspect-video overflow-hidden block mb-3 group">
        <img
          src={news.imageUrl}
          alt={news.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      </Link>
      <div className="flex flex-col flex-grow">
        <Link to={`/noticia/${news.id}`} className="hover:text-[#FF0000] transition-colors">
          <h3 className="text-xl font-black leading-none mb-2 tracking-tighter uppercase">
            {news.title}
          </h3>
        </Link>
        <p className="text-gray-600 text-[11px] leading-snug line-clamp-3 font-medium">
          {news.summary}
        </p>
      </div>
    </motion.div>
  );
}
