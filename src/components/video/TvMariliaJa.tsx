import { useState, useEffect } from 'react';
import { YouTubeVideo } from '../../types';
import { videoService } from '../../lib/videoService';
import { Youtube, Play, ExternalLink, Film, CheckCircle } from 'lucide-react';

interface TvMariliaJaProps {
  initialVideos?: YouTubeVideo[];
}

export default function TvMariliaJa({ initialVideos }: TvMariliaJaProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos || []);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    const unsubscribe = videoService.subscribe((list) => {
      setVideos(list);
      if (list.length > 0) {
        // Keep currently selected or default to featured/first
        setSelectedVideo(current => {
          if (current) {
            const found = list.find(v => v.id === current.id);
            if (found) return found;
          }
          const feat = list.find(v => v.isFeatured);
          return feat || list[0];
        });
      } else {
        setSelectedVideo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (videos.length === 0) {
    return null;
  }

  const active = selectedVideo || videos[0];

  return (
    <section 
      id="tv-marilia-ja" 
      aria-label="TV Marília Já - Vídeos e Reportagens"
      className="w-full max-w-full overflow-hidden bg-gradient-to-b from-[#141414] to-[#0A0A0A] text-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border-4 border-black shadow-2xl box-border"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-neutral-800 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 bg-[#FF0000] text-white font-black text-xs sm:text-sm px-3 py-1 rounded-md tracking-wider uppercase shadow-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
            TV
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            TV MARÍLIA JÁ
          </h2>
          <span className="hidden md:inline text-xs font-bold text-neutral-400 uppercase tracking-widest pl-2 border-l border-neutral-700">
            Jornalismo em Vídeo e Coberturas Locais
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://www.youtube.com/results?search_query=marilia+sp+noticias"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-[#FF0000] text-neutral-200 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-neutral-700 hover:border-transparent cursor-pointer shadow-sm"
          >
            <Youtube size={16} className="text-[#FF0000] group-hover:text-white fill-current" />
            Canal no YouTube
            <ExternalLink size={12} className="opacity-70" />
          </a>
        </div>
      </div>

      {/* Main Broadcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* Left / Primary Video Player (7 or 8 columns on large screen) */}
        <div className="lg:col-span-8 flex flex-col space-y-4 w-full">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border-2 border-neutral-800 shadow-xl group">
            {active ? (
              <iframe
                key={active.youtubeId}
                src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                title={active.title}
                className="w-full h-full absolute inset-0 border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                <Film size={48} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">Nenhum vídeo selecionado</p>
              </div>
            )}
          </div>

          {/* Active video details */}
          {active && (
            <div className="bg-neutral-900/80 p-4 sm:p-5 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#FF0000] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  EM EXIBIÇÃO
                </span>
                {active.isFeatured && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
                    <CheckCircle size={10} /> Destaque da Semana
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                {active.title}
              </h3>
              {active.description && (
                <p className="text-xs sm:text-sm text-neutral-300 font-medium leading-relaxed">
                  {active.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right / Playlist Selection (4 or 5 columns on large screen) */}
        <div className="lg:col-span-4 flex flex-col w-full">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
            <h4 className="text-xs font-black uppercase tracking-widest text-neutral-300 flex items-center gap-2">
              <Film size={14} className="text-[#FF0000]" />
              Playlist de Vídeos ({videos.length})
            </h4>
            <span className="text-[10px] text-neutral-500 font-bold">Clique para assistir</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {videos.map((vid) => {
              const isCurrent = active?.id === vid.id;
              const thumbUrl = `https://img.youtube.com/vi/${vid.youtubeId}/mqdefault.jpg`;

              return (
                <button
                  key={vid.id}
                  onClick={() => setSelectedVideo(vid)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 border group cursor-pointer ${
                    isCurrent
                      ? 'bg-neutral-800/95 border-[#FF0000] shadow-md ring-1 ring-[#FF0000]/50'
                      : 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  {/* Thumbnail with play badge */}
                  <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800 group-hover:scale-102 transition-transform">
                    <img
                      src={thumbUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                        isCurrent ? 'bg-[#FF0000] text-white scale-110' : 'bg-black/70 text-white group-hover:bg-[#FF0000]'
                      }`}>
                        <Play size={12} className="ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    {isCurrent && (
                      <span className="inline-block text-[9px] font-black uppercase text-[#FF0000] tracking-wider mb-1">
                        ● Tocando Agora
                      </span>
                    )}
                    <h5 className={`text-xs font-bold line-clamp-2 leading-snug transition-colors ${
                      isCurrent ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                    }`}>
                      {vid.title}
                    </h5>
                    {vid.description && (
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1 font-medium">
                        {vid.description}
                      </p>
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
