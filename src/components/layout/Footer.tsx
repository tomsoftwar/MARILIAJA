import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12 mt-12" id="main-footer">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-800 pb-6 mb-6 gap-8">
          <div className="text-left">
            <h2 className="text-3xl font-black text-[#FF0000] tracking-tighter mb-1 uppercase">MARÍLIAJÁ</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
              O mais completo portal de notícias online para anunciar sua marca.
            </p>
          </div>
          <div className="flex gap-4">
            {['f', 'ig', 'x', 'yt'].map((social) => (
              <div key={social} className="w-8 h-8 md:w-6 md:h-6 bg-gray-900 hover:bg-[#FF0000] transition-colors rounded-full flex items-center justify-center text-[10px] font-black cursor-pointer uppercase">
                {social}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-black text-xs uppercase mb-4 text-[#FF0000]">EDITORIAS</h3>
            <ul className="text-gray-400 space-y-2 text-[10px] font-bold uppercase tracking-wider">
              <li><Link to="/?cat=POLÍCIA" className="hover:text-white transition-colors">POLÍCIA</Link></li>
              <li><Link to="/?cat=POLÍTICA" className="hover:text-white transition-colors">POLÍTICA</Link></li>
              <li><Link to="/?cat=CIDADE" className="hover:text-white transition-colors">CIDADE</Link></li>
              <li><Link to="/?cat=VARIEDADES" className="hover:text-white transition-colors">VARIEDADES</Link></li>
              <li><Link to="/?cat=REGIÃO" className="hover:text-white transition-colors">REGIÃO</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-black text-xs uppercase mb-4 text-[#FF0000]">INSTITUCIONAL</h3>
            <ul className="text-gray-400 space-y-2 text-[10px] font-bold uppercase tracking-wider">
              <li><Link to="/quem-somos" className="hover:text-white transition-colors">Quem Somos</Link></li>
              <li><Link to="/politica-privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link to="/termos-uso" className="hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link to="/anuncie" className="hover:text-white transition-colors">Anuncie</Link></li>
              <li><Link to="/contato" className="hover:text-white transition-colors">Contato</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold pt-8 border-t border-gray-900 gap-4">
          <p>Desenvolvido pela <span className="text-white">TOMSOFT</span> - @2026</p>
          <div className="flex items-center gap-4">
            <p>MARÍLIAJÁ - 2014-2026</p>
            <span className="w-1 h-1 bg-gray-800 rounded-full"></span>
            <Link to="/login" className="hover:text-white underline">Área Restrita</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
