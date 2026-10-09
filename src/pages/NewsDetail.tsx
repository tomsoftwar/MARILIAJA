import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { type NewsArticle } from '../types';
import { newsService } from '../lib/newsService';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Share2, Facebook, Twitter, Link as LinkIcon, MessageCircle } from 'lucide-react';
import AdRenderer from '../components/layout/AdRenderer';

export default function NewsDetail() {
  const { id } = useParams();
  const [news, setNews] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = newsService.subscribe((items) => {
      const found = items.find(n => n.id === id);
      setNews(found || null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0000]"></div></div>;
  if (!news) return <div className="h-96 flex items-center justify-center text-2xl font-bold uppercase tracking-tighter">Notícia não encontrada.</div>;

  const shareUrl = window.location.href;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${news.title}\n\nLeia mais em: ${shareUrl}`)}`;

  const createdDate = news.createdAt ? new Date(news.createdAt) : new Date();

  return (
    <article className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 overflow-x-hidden box-border" id="news-article">
      <div className="max-w-4xl mx-auto w-full">
        <AdRenderer content={news.adTop} position="top" />

        <Link to="/" className="text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:text-black mb-6 md:mb-8 inline-block transition-colors">
          ← Voltar para o portal
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .news-content-html {
          max-width: 100%;
          overflow-wrap: break-word;
          word-break: break-word;
          box-sizing: border-box;
        }
        .news-content-html * {
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow-wrap: break-word !important;
        }
        .news-content-html h1, .news-content-html h2, .news-content-html h3, .news-content-html h4 {
          font-weight: 900;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          line-height: 1.15;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .news-content-html h1 { font-size: clamp(1.5rem, 5vw, 2.25rem); }
        .news-content-html h2 { font-size: clamp(1.25rem, 4vw, 1.85rem); }
        .news-content-html h3 { font-size: clamp(1.1rem, 3.5vw, 1.5rem); }
        .news-content-html p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .news-content-html img {
          max-width: 100%;
          height: auto;
          border: 4px solid black;
          margin: 1.5rem auto;
          display: block;
        }
        .news-content-html iframe, .news-content-html .ql-video {
          width: 100%;
          max-width: 100%;
          aspect-ratio: 16/9;
          border: 4px solid black;
          margin: 1.5rem 0;
        }
        .news-content-html table {
          width: 100%;
          max-width: 100%;
          display: block;
          overflow-x: auto;
          border-collapse: collapse;
        }
        .news-content-html pre, .news-content-html code {
          max-width: 100%;
          white-space: pre-wrap;
          word-break: break-all;
          overflow-x: auto;
        }
        .news-content-html ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .news-content-html ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
        .news-content-html a { color: #FF0000; text-decoration: underline; font-weight: bold; overflow-wrap: anywhere; word-break: break-all; }
        .news-content-html a:hover { color: black; }
        .news-content-html .ql-align-center { text-align: center; }
        .news-content-html .ql-align-right { text-align: right; }
        .news-content-html .ql-align-justify { text-align: justify; }
      `}} />

      <div className={`grid grid-cols-1 ${news.adSide ? 'lg:grid-cols-12 gap-8 lg:gap-12' : 'max-w-4xl mx-auto'} w-full max-w-full overflow-hidden`}>
        <div className={`${news.adSide ? 'lg:col-span-8' : ''} w-full max-w-full min-w-0 overflow-hidden`}>
          {/* Header */}
          <header className="mb-8 md:mb-10 text-left border-b-2 border-black pb-6 md:pb-8 w-full max-w-full">
            <span className="bg-[#FF0000] text-white text-[10px] font-black uppercase px-3 py-1 tracking-widest inline-block mb-3">
              {news.category}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight sm:tracking-tighter mb-4 md:mb-6 leading-tight break-words [overflow-wrap:anywhere]">
              {news.title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 font-bold mb-6 md:mb-8 leading-relaxed break-words [overflow-wrap:anywhere]">
              {news.summary}
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-100 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{format(createdDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>{news.authorSignature || 'Por Redação MaríliaJá'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 font-black">COMPARTILHAR:</span>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-600 transition-colors p-1" title="Compartilhar no WhatsApp">
                  <MessageCircle size={18} />
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Compartilhar no Facebook">
                  <Facebook size={18} />
                </a>
                <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(news.title)}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors p-1" title="Compartilhar no Twitter">
                  <Twitter size={18} />
                </a>
              </div>
            </div>
          </header>

          {/* Main Image */}
          <figure className="mb-8 md:mb-12 border-4 border-black overflow-hidden w-full max-w-full">
            <img src={news.imageUrl} alt={news.title} className="w-full h-auto max-h-[600px] object-cover" />
            {news.imageCaption && (
              <figcaption className="bg-gray-100 p-3 text-[11px] font-bold text-gray-600 tracking-wide border-t-2 border-black italic break-words">
                {news.imageCaption}
              </figcaption>
            )}
          </figure>

          {/* Ad Middle */}
          <AdRenderer content={news.adMiddle} position="middle" />

          {/* Rich Content */}
          <div 
            className="news-content-html text-gray-800 text-base sm:text-lg leading-relaxed font-normal w-full max-w-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(news.content, { ADD_TAGS: ['iframe'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }}
          />

          {/* Ad Bottom */}
          <AdRenderer content={news.adBottom} position="bottom" />

          {/* Author Signature */}
          {news.authorSignature && (
            <div className="mt-8 md:mt-12 p-5 md:p-6 bg-gray-50 border-l-4 border-[#FF0000] text-sm font-bold text-gray-700 uppercase tracking-wider break-words">
              {news.authorSignature}
            </div>
          )}
        </div>

        {/* Sidebar Ad */}
        {news.adSide && (
          <aside className="lg:col-span-4 mt-8 lg:mt-0 w-full max-w-full">
            <div className="sticky top-20">
              <AdRenderer content={news.adSide} position="side" />
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}
