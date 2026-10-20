import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

export default function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="pt-4 sm:pt-6 pb-3 sm:pb-4 bg-white text-center w-full max-w-full overflow-hidden box-border" id="main-header">
      <div className="container mx-auto px-4 max-w-7xl w-full">
        <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-[#FF0000] tracking-tight sm:tracking-tighter mb-0 leading-none select-none break-words" id="site-title">
          MARÍLIAJÁ
        </h1>
        <p className="text-xs sm:text-sm md:text-base font-bold text-black uppercase tracking-wider sm:tracking-[0.2em] mt-1 mb-4 sm:mb-6 px-2 break-words" id="site-subtitle">
          O Portal de Notícias de Marília e Região
        </p>
        
        <div className="flex flex-col md:flex-row justify-between items-center py-2 border-t border-gray-200 text-[10px] uppercase font-bold text-gray-500 gap-2 sm:gap-4 w-full" id="header-meta">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="capitalize">
              {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>{format(now, "HH:mm")}</span>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-[#FF0000] cursor-pointer transition-colors">INSTAGRAM</span>
            <span className="hover:text-[#FF0000] cursor-pointer transition-colors">FACEBOOK</span>
            <span className="hover:text-[#FF0000] cursor-pointer transition-colors">TWITTER</span>
          </div>
        </div>
      </div>
    </header>
  );
}
