import { useState, useEffect } from 'react';
import { YouTubeVideo } from '../../types';
import { videoService } from '../../lib/videoService';
import { Play, Tv, ExternalLink, Film, CheckCircle2 } from 'lucide-react';

export default function TvMariliaSection() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    const unsub = videoService.subscribe((list) => {
      setVideos(list);
      if (list.length > 0) {
        // Default to featured or first video
        const featured = list.find(v => v.isFeatured) || list[0];
        setActiveVideo(prev => {
          if (!prev) return featured;
          // Keep current if still exists, else update
          return list.find(v => v.id === prev.id) || featured;
        });
      }
    });

    return () => unsub();
  }, []);

  if (videos.length === 0) return null;

  return (
    <section id="tv-marilia" className="w-full bg-zinc-950 text-white border-4 md:border-8 border-black rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden box-border">
      {/* Decorative Red Accent Bars */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#FF0000]"></div>

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8 border-b border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#FF0000] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-2 shadow-sm">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            TV MARÍLIA JÁ
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Tv className="text-[#FF0000] shrink-0" size={36} />
            TV MARÍLIA JÁ
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-bold mt-1 max-w-xl">
            Acompanhe as últimas coberturas, entrevistas e reportagens em vídeo da nossa cidade e região.
          </p>
        </div>

        {activeVideo && (
          <a
            href={activeVideo.youtubeUrl || `https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-[#FF0000] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-zinc-800 self-start md:self-end shrink-0"
          >
            <ExternalLink size={14} /> Abrir no YouTube
          </a>
        )}
      </div>

      {/* Main Grid: Player + Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Main Video Screen (8 cols) */}
        {activeVideo && (
          <div className="lg:col-span-8 space-y-4">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-4 border-zinc-800 bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="bg-zinc-900/80 p-4 sm:p-5 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5">
                <Film size={13} /> Em Reprodução
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-snug break-words">
                {activeVideo.title}
              </h3>
              {activeVideo.description && (
                <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-2 leading-relaxed break-words">
                  {activeVideo.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Playlist List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 px-1 flex items-center justify-between">
            <span>Mais Vídeos ({videos.length})</span>
            <span className="text-[#FF0000]">Clique para assistir</span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {videos.map((vid) => {
              const isSelected = activeVideo?.id === vid.id;
              const thumbUrl = `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`;

              return (
                <button
                  key={vid.id}
                  onClick={() => setActiveVideo(vid)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 border ${
                    isSelected
                      ? 'bg-zinc-800/90 border-[#FF0000] ring-1 ring-[#FF0000] shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                  } cursor-pointer group`}
                >
                  {/* Thumbnail with play badge */}
                  <div className="relative w-28 sm:w-32 aspect-video shrink-0 rounded-lg overflow-hidden border border-zinc-800 bg-black">
                    <img
                      src={thumbUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to standard quality
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${vid.youtubeId}/0.jpg`;
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                      <div className={`p-1.5 rounded-full ${isSelected ? 'bg-[#FF0000]' : 'bg-black/70 group-hover:bg-[#FF0000]'} text-white transition-colors`}>
                        <Play size={10} fill="currentColor" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <h4 className={`text-xs sm:text-sm font-black uppercase tracking-tight line-clamp-2 leading-snug ${
                      isSelected ? 'text-[#FF0000]' : 'text-zinc-100 group-hover:text-white'
                    }`}>
                      {vid.title}
                    </h4>
                    {vid.description && (
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-1 font-medium">
                        {vid.description}
                      </p>
                    )}
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 mt-1 uppercase">
                        <CheckCircle2 size={10} /> Tocando agora
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
