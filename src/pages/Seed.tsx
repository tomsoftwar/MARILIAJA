import { useState } from 'react';
import { newsService } from '../lib/newsService';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Seed() {
  const [done, setDone] = useState(false);

  function handleSeed() {
    newsService.resetToDefault();
    setDone(true);
  }

  return (
    <div className="container mx-auto px-4 py-20 max-w-xl text-center">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
        Restaurar Notícias Iniciais
      </h1>
      <p className="text-gray-500 font-bold mb-8 text-sm">
        Clique no botão abaixo para restaurar o catálogo de notícias iniciais do portal MARÍLIAJÁ.
      </p>

      {done ? (
        <div className="bg-emerald-50 border-2 border-emerald-500 p-8 rounded-2xl">
          <CheckCircle2 size={48} className="text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-emerald-900 uppercase">Notícias Restauradas!</h2>
          <p className="text-emerald-700 text-sm font-bold mt-2 mb-6">
            O catálogo inicial de notícias foi carregado com sucesso.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FF0000] transition-colors"
          >
            Ir para a Home
          </Link>
        </div>
      ) : (
        <button
          onClick={handleSeed}
          className="bg-[#FF0000] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-3 mx-auto shadow-xl"
        >
          <RotateCcw size={18} />
          Restaurar Notícias Padrão
        </button>
      )}
    </div>
  );
}
