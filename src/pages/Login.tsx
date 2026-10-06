import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, AuthUser } from '../lib/authService';
import { Lock, User, Github, AlertCircle, KeyRound, ExternalLink } from 'lucide-react';

export default function Login() {
  const [tab, setTab] = useState<'credentials' | 'github'>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [githubToken, setGithubToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  // If already logged in, redirect to /postar
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      navigate('/postar');
    }
  }, [navigate]);

  const handleCredentialsLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setLoading(true);

    try {
      authService.login(identifier, password);
      navigate('/postar');
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao entrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setLoading(true);

    try {
      await authService.loginWithGitHub(githubToken);
      navigate('/postar');
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao autenticar com o GitHub Token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[75vh]">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Área Restrita</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
          Portal de Notícias MARÍLIAJÁ (GitHub Edition)
        </p>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border-4 border-black max-w-md w-full">
        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl mb-6 font-black text-xs uppercase tracking-wider">
          <button
            type="button"
            onClick={() => { setTab('credentials'); setErrorStatus(null); }}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'credentials' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}
          >
            <User size={14} /> Usuário / E-mail
          </button>
          <button
            type="button"
            onClick={() => { setTab('github'); setErrorStatus(null); }}
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'github' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}
          >
            <Github size={14} /> GitHub Token
          </button>
        </div>

        {/* Error message */}
        {errorStatus && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-xs font-bold border-2 border-red-200 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="leading-tight">{errorStatus}</div>
          </div>
        )}

        {/* TAB 1: USERNAME / EMAIL LOGIN */}
        {tab === 'credentials' && (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                E-mail ou Usuário *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="admin, tomsoftwar ou seu e-mail"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#FF0000] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                Senha (Opcional)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#FF0000] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF0000] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Entrar no Painel"
                )}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center font-bold uppercase tracking-wider pt-2">
              Acesso Master: Digite <strong>admin</strong> ou <strong>tomsoftwar</strong>
            </p>
          </form>
        )}

        {/* TAB 2: GITHUB TOKEN (PAT) LOGIN */}
        {tab === 'github' && (
          <form onSubmit={handleGitHubLogin} className="space-y-4">
            <p className="text-xs text-gray-600 font-medium">
              Entre com seu <strong>GitHub Personal Access Token (PAT)</strong> para postar notícias e sincronizar commits automaticamente no repositório.
            </p>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                GitHub Token (com escopo repo) *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-bold text-sm font-mono outline-none focus:border-[#FF0000] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FF0000] transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Github size={16} /> Entrar com GitHub Token
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 border-t border-gray-100 text-center">
              <a 
                href="https://github.com/settings/tokens/new?scopes=repo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-500 hover:text-black tracking-wider"
              >
                Como gerar um token no GitHub <ExternalLink size={12} />
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
