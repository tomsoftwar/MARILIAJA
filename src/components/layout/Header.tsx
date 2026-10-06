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
    <header className="pt-6 pb-4 bg-white text-center" id="main-header">
      <div className="container mx-auto px-4 max-w-7xl">
        <h1 className="text-7xl md:text-9xl font-black text-[#FF0000] tracking-tighter mb-0 leading-none" id="site-title">
          MARÍLIAJÁ
        </h1>
        <p className="text-sm md:text-base font-bold text-black uppercase tracking-[0.2em] mt-1 mb-6" id="site-subtitle">
          O Portal de Notícias de Marília e Região
        </p>
        
        <div className="flex flex-col md:flex-row justify-between items-center py-2 border-t border-gray-200 text-[10px] uppercase font-bold text-gray-500 gap-4" id="header-meta">
          <div className="flex items-center gap-2">
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
