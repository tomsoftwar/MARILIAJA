import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Menu as MenuIcon, X, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authService, AuthUser } from '../../lib/authService';

const MENU_ITEMS = [
  { label: 'HOME', path: '/' },
  { label: 'QUEM SOMOS', path: '/quem-somos' },
  { label: 'POLÍTICAS DE PRIVACIDADE', path: '/politica-privacidade' },
  { label: 'TERMOS DE USO', path: '/termos-uso' },
  { label: 'ANUNCIE NO MJ', path: '/anuncie' },
  { label: 'CONTATO', path: '/contato' },
];

export default function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = authService.subscribe((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const isAuthorized = user && (user.role === 'admin' || user.role === 'editor');

  return (
    <nav className="bg-black sticky top-0 z-50 shadow-xl" id="main-nav">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14 md:h-10 text-white font-bold text-[11px] tracking-[0.15em] uppercase">
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center justify-center flex-grow gap-8">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "hover:text-[#FF0000] transition-colors py-2",
                  location.pathname === item.path && "text-[#FF0000]"
                )}
              >
                {item.label}
              </Link>
            ))}
            
            {user && isAuthorized ? (
              <div className="flex items-center gap-4 shrink-0">
                <Link
                  to="/postar"
                  className={cn(
                    "flex items-center gap-2 bg-[#FF0000] text-white px-3 py-1 rounded hover:bg-red-700 transition-colors shrink-0",
                    location.pathname === '/postar' && "ring-2 ring-white"
                  )}
                >
                  <PlusCircle size={14} />
                  MARÍLIA JÁ
                </Link>
                <button
                  onClick={() => authService.signOut()}
                  className="hover:text-[#FF0000] cursor-pointer transition-colors text-[10px]"
                >
                  SAIR
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 bg-[#FF0000] text-white px-3 py-1 rounded hover:bg-red-700 transition-colors shrink-0"
              >
                <PlusCircle size={14} />
                POSTAR NOTÍCIA
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-4">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "text-white font-bold text-lg hover:text-[#FF0000] transition-colors",
                  location.pathname === item.path && "text-[#FF0000]"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user && isAuthorized ? (
              <>
                <Link
                  to="/postar"
                  className="text-[#FF0000] font-black text-lg flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <PlusCircle size={20} />
                  POSTAR NOTÍCIA
                </Link>
                <button
                  onClick={() => {
                    authService.signOut();
                    setIsOpen(false);
                  }}
                  className="text-white font-bold text-lg text-left"
                >
                  SAIR
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-[#FF0000] font-black text-lg flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <PlusCircle size={20} />
                POSTAR NOTÍCIA
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
