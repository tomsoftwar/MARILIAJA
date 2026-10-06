import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsCategory, NewsArticle, Collaborator } from '../types';
import { newsService } from '../lib/newsService';
import { authService, AuthUser } from '../lib/authService';
import { 
  Trash2, Edit, Plus, LayoutGrid, X, Users, UserPlus, 
  Shield, CheckCircle2, Lock, UserCheck, Download, Github, 
  RefreshCw, Settings
} from 'lucide-react';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function PostNews() {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: NewsCategory.CIDADE,
    imageUrl: '',
    imageCaption: '',
    authorSignature: '',
    adTop: '',
    adMiddle: '',
    adSide: '',
    adBottom: '',
    isFeatured: false
  });
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [collaboratorsList, setCollaboratorsList] = useState<Collaborator[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<'manage' | 'form' | 'collaborators' | 'github'>('manage');
  const [newsFilter, setNewsFilter] = useState<'all' | 'mine'>('all');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteCollabEmail, setConfirmDeleteCollabEmail] = useState<string | null>(null);

  // Collaborator form state
  const [collabEmail, setCollabEmail] = useState('');
  const [collabName, setCollabName] = useState('');
  const [collabRole, setCollabRole] = useState<'editor' | 'admin'>('editor');
  const [collabPassword, setCollabPassword] = useState('');
  const [collabLoading, setCollabLoading] = useState(false);

  // Security / Password change state
  const [currentMasterPass, setCurrentMasterPass] = useState('');
  const [newMasterPass, setNewMasterPass] = useState('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [editingCollabPassEmail, setEditingCollabPassEmail] = useState<string | null>(null);
  const [newCollabPass, setNewCollabPass] = useState('');

  // GitHub Sync state
  const [githubSettings, setGithubSettings] = useState(authService.getGitHubSettings());
  const [syncingGit, setSyncingGit] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // If user has token, update settings state
    if (currentUser.githubToken) {
      setGithubSettings(prev => ({ ...prev, token: currentUser.githubToken! }));
    }

    // Subscribe to news changes
    const unsubNews = newsService.subscribe((items) => {
      setNewsList(items);
    });

    // Load collaborators
    setCollaboratorsList(authService.getCollaborators());

    return () => {
      unsubNews();
    };
  }, [navigate]);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);

    try {
      newsService.saveNews(formData, user.uid, editingId);
      setSuccessStatus(editingId ? "Notícia atualizada com sucesso!" : "Notícia publicada com sucesso no portal!");
      resetForm();
      setView('manage');
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao salvar notícia.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (news: NewsArticle) => {
    if (!isAdmin && news.authorId !== user.uid) {
      setErrorStatus("Você só tem permissão para editar suas próprias notícias.");
      return;
    }

    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content,
      category: news.category,
      imageUrl: news.imageUrl,
      imageCaption: news.imageCaption || '',
      authorSignature: news.authorSignature || '',
      adTop: news.adTop || '',
      adMiddle: news.adMiddle || '',
      adSide: news.adSide || '',
      adBottom: news.adBottom || '',
      isFeatured: news.isFeatured || false
    });
    setEditingId(news.id);
    setView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string, authorId: string) => {
    try {
      setLoading(true);
      setErrorStatus(null);
      setSuccessStatus(null);

      newsService.deleteNews(id, user.uid, isAdmin);
      setConfirmDeleteId(null);
      setSuccessStatus("Notícia excluída com sucesso.");
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao excluir notícia.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorStatus("Apenas administradores podem cadastrar colaboradores.");
      return;
    }

    setCollabLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);

    try {
      authService.addCollaborator({
        email: collabEmail,
        name: collabName,
        role: collabRole,
        password: collabPassword,
        addedBy: user.email
      });

      setCollaboratorsList(authService.getCollaborators());
      setSuccessStatus(`Colaborador (${collabEmail}) cadastrado com sucesso com senha de acesso!`);
      setCollabEmail('');
      setCollabName('');
      setCollabRole('editor');
      setCollabPassword('');
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao adicionar colaborador.");
    } finally {
      setCollabLoading(false);
    }
  };

  const handleChangeMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);
    setPasswordSuccessMessage(null);
    try {
      authService.changeMasterPassword(currentMasterPass, newMasterPass);
      setSuccessStatus("SENHA ALTERADA COM SUCESSO!");
      setPasswordSuccessMessage("SENHA ALTERADA COM SUCESSO!");
      setCurrentMasterPass('');
      setNewMasterPass('');
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao alterar a senha do Administrador.");
    }
  };

  const handleUpdateCollabPassword = (email: string) => {
    if (!newCollabPass) return;
    setErrorStatus(null);
    try {
      authService.updateCollaboratorPassword(email, newCollabPass);
      setCollaboratorsList(authService.getCollaborators());
      setSuccessStatus("SENHA ALTERADA COM SUCESSO!");
      setEditingCollabPassEmail(null);
      setNewCollabPass('');
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao alterar senha do colaborador.");
    }
  };

  const handleDeleteCollaborator = (email: string) => {
    if (!isAdmin) return;
    try {
      authService.removeCollaborator(email);
      setCollaboratorsList(authService.getCollaborators());
      setConfirmDeleteCollabEmail(null);
      setSuccessStatus(`Acesso do colaborador (${email}) revogado com sucesso.`);
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao revogar colaborador.");
    }
  };

  const handleSaveGitHubSettings = (e: React.FormEvent) => {
    e.preventDefault();
    authService.saveGitHubSettings(githubSettings);
    setSuccessStatus("Configurações do GitHub salvas com sucesso!");
  };

  const handleSyncToGitHub = async () => {
    if (!githubSettings.token) {
      setErrorStatus("Por favor, informe seu GitHub Token na aba 'GitHub CMS' para sincronizar os commits.");
      setView('github');
      return;
    }

    setSyncingGit(true);
    setErrorStatus(null);
    setSuccessStatus(null);

    const result = await newsService.syncWithGitHub({
      githubToken: githubSettings.token,
      repo: githubSettings.repo,
      branch: githubSettings.branch
    });

    setSyncingGit(false);
    if (result.success) {
      setSuccessStatus(`Notícias sincronizadas com o GitHub com sucesso! O GitHub Pages atualizará o site automaticamente.`);
    } else {
      setErrorStatus(`Falha na sincronização: ${result.error}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      category: NewsCategory.CIDADE,
      imageUrl: '',
      imageCaption: '',
      authorSignature: '',
      adTop: '',
      adMiddle: '',
      adSide: '',
      adBottom: '',
      isFeatured: false
    });
    setEditingId(null);
  };

  const displayedNews = newsFilter === 'mine' 
    ? newsList.filter(n => n.authorId === user.uid)
    : newsList;

  const myPostsCount = newsList.filter(n => n.authorId === user.uid).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b-8 border-black pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Área Restrita</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Usuário: <span className="text-black font-bold">{user.displayName || user.email}</span>
            </span>
            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-red-100 text-[#FF0000] px-2 py-0.5 rounded">
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </span>
          </div>
        </div>

        {/* View selection tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1 flex-wrap">
          <button 
            onClick={() => { setView('manage'); resetForm(); }}
            className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'manage' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
          >
            <LayoutGrid size={16} /> Notícias ({newsList.length})
          </button>
          <button 
            onClick={() => { setView('form'); resetForm(); }}
            className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'form' ? 'bg-[#FF0000] text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
          >
            <Plus size={16} /> Nova Notícia
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => { setView('collaborators'); resetForm(); }}
                className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'collaborators' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
              >
                <Users size={16} /> Colaboradores
              </button>
              <button 
                onClick={() => { setView('github'); resetForm(); }}
                className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'github' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
              >
                <Github size={16} /> GitHub CMS
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Feedback alerts */}
      {errorStatus && (
        <div className="bg-red-50 text-red-600 p-5 rounded-xl mb-6 font-bold border-2 border-red-200 text-sm flex justify-between items-center animate-in fade-in">
          <span>{errorStatus}</span>
          <button onClick={() => setErrorStatus(null)} className="p-1 hover:bg-red-100 rounded transition-colors"><X size={18} /></button>
        </div>
      )}

      {successStatus && (
        <div className="bg-emerald-50 text-emerald-800 p-5 rounded-xl mb-6 font-bold border-2 border-emerald-200 text-sm flex justify-between items-center animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span>{successStatus}</span>
          </div>
          <button onClick={() => setSuccessStatus(null)} className="p-1 hover:bg-emerald-100 rounded transition-colors"><X size={18} /></button>
        </div>
      )}

      {/* VIEW: GITHUB CMS & SYNC (Admin Only) */}
      {view === 'github' && isAdmin && (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="bg-white border-4 border-black p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Github className="text-black" size={32} />
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Sincronização com o GitHub</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Publique o catálogo de notícias diretamente no seu repositório do GitHub Pages.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                onClick={handleSyncToGitHub}
                disabled={syncingGit}
                className="bg-[#FF0000] text-white p-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-3 shadow-lg disabled:bg-gray-300"
              >
                {syncingGit ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <RefreshCw size={18} />
                )}
                Sincronizar no GitHub Agora
              </button>

              <button
                type="button"
                onClick={() => newsService.downloadNewsJson()}
                className="bg-black text-white p-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-3 shadow-lg"
              >
                <Download size={18} />
                Baixar news.json
              </button>
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSaveGitHubSettings} className="space-y-4 pt-6 border-t-2 border-gray-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
                <Settings size={16} /> Configurações do Repositório
              </h3>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Repositório GitHub (usuario/nome-do-repo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: tomsoftwar/portal-mariliaja"
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold font-mono text-sm focus:border-[#FF0000] outline-none"
                  value={githubSettings.repo}
                  onChange={(e) => setGithubSettings({ ...githubSettings, repo: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Branch Principal
                </label>
                <input
                  type="text"
                  required
                  placeholder="main"
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold font-mono text-sm focus:border-[#FF0000] outline-none"
                  value={githubSettings.branch}
                  onChange={(e) => setGithubSettings({ ...githubSettings, branch: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  GitHub Personal Access Token (com permissão 'repo')
                </label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold font-mono text-sm focus:border-[#FF0000] outline-none"
                  value={githubSettings.token}
                  onChange={(e) => setGithubSettings({ ...githubSettings, token: e.target.value })}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  O token é armazenado com segurança apenas no seu navegador para realizar os commits de notícias no arquivo <code>public/data/news.json</code>.
                </p>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white hover:bg-black rounded-xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                Salvar Configurações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: COLLABORATORS MANAGEMENT (Admin Only) */}
      {view === 'collaborators' && isAdmin && (
        <div className="space-y-10">
          <div className="bg-gray-50 border-4 border-black p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="text-[#FF0000]" size={28} />
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Cadastrar Novo Colaborador</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Cadastre jornalistas e repórteres para postarem notícias com login próprio.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddCollaborator} className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  E-mail ou Usuário *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="ex: carlos_silva ou carlos@email.com"
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold focus:border-[#FF0000] outline-none transition-all text-sm"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Nome Completo
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Carlos Silva (Redator)"
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold focus:border-[#FF0000] outline-none transition-all text-sm"
                  value={collabName}
                  onChange={(e) => setCollabName(e.target.value)}
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Senha de Acesso *
                </label>
                <input 
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold focus:border-[#FF0000] outline-none transition-all text-sm"
                  value={collabPassword}
                  onChange={(e) => setCollabPassword(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Função
                </label>
                <select 
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-black text-xs uppercase focus:border-[#FF0000] outline-none cursor-pointer transition-all"
                  value={collabRole}
                  onChange={(e) => setCollabRole(e.target.value as 'editor' | 'admin')}
                >
                  <option value="editor">Colaborador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="md:col-span-12 mt-2">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-4 text-xs text-amber-800 font-medium">
                  <strong>Regra de Acesso:</strong> Usuários com função <strong>Colaborador (Editor)</strong> podem publicar notícias e <u>deletar somente as suas próprias notícias</u>. Somente Administradores têm permissão para deletar notícias de qualquer autor.
                </div>
                <button
                  type="submit"
                  disabled={collabLoading}
                  className="w-full md:w-auto px-8 py-3.5 bg-black text-white hover:bg-[#FF0000] rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  {collabLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserCheck size={16} /> Cadastrar Colaborador com Senha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Master Admin Security / Password Change Box */}
          <div className="bg-white border-4 border-black p-8 rounded-2xl shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 mb-2">
              <Shield size={20} className="text-[#FF0000]" /> Segurança da Conta Master (Alterar Senha do Administrador)
            </h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">
              Mantenha seu portal protegido alterando a senha master sempre que necessário.
            </p>

            {passwordSuccessMessage && (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl mb-6 font-black text-sm border-2 border-emerald-300 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span>{passwordSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleChangeMasterPassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Senha Master Atual *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Digite a senha atual"
                  className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-[#FF0000]"
                  value={currentMasterPass}
                  onChange={(e) => setCurrentMasterPass(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Nova Senha Master *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-[#FF0000]"
                  value={newMasterPass}
                  onChange={(e) => setNewMasterPass(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-[#FF0000] text-white py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>

          {/* List of collaborators */}
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 mb-4">
              <Shield size={20} className="text-[#FF0000]" /> Colaboradores Autorizados ({collaboratorsList.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collaboratorsList.map((collab) => (
                <div key={collab.email} className="bg-white border-2 border-black p-5 rounded-xl flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-base truncate">{collab.name || collab.email}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${collab.role === 'admin' ? 'bg-black text-white' : 'bg-red-100 text-[#FF0000]'}`}>
                          {collab.role === 'admin' ? 'Administrador' : 'Colaborador'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-bold truncate mt-0.5">{collab.email}</p>
                    </div>

                    <div>
                      {confirmDeleteCollabEmail === collab.email ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteCollaborator(collab.email)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded font-black text-[10px] uppercase hover:bg-black transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCollabEmail(null)}
                            className="bg-gray-200 text-black px-2 py-1.5 rounded font-black text-[10px] uppercase hover:bg-gray-300"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteCollabEmail(collab.email)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Revogar Acesso"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reset collaborator password */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    {editingCollabPassEmail === collab.email ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="password"
                          placeholder="Nova senha"
                          className="border border-gray-300 rounded px-2 py-1 text-xs font-bold w-full outline-none focus:border-[#FF0000]"
                          value={newCollabPass}
                          onChange={(e) => setNewCollabPass(e.target.value)}
                        />
                        <button
                          onClick={() => handleUpdateCollabPassword(collab.email)}
                          className="bg-black text-white px-3 py-1 rounded text-[10px] font-black uppercase hover:bg-[#FF0000]"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingCollabPassEmail(null)}
                          className="bg-gray-200 text-black px-2 py-1 rounded text-[10px] font-black uppercase"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingCollabPassEmail(collab.email); setNewCollabPass(''); }}
                        className="text-[10px] font-black uppercase text-gray-500 hover:text-black underline"
                      >
                        Redefinir Senha do Colaborador
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: FORM (CREATE / EDIT NEWS) */}
      {view === 'form' && (
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-black uppercase tracking-tighter border-l-8 border-[#FF0000] pl-4">
              {editingId ? 'Editar Notícia' : 'Criar Nova Notícia'}
            </h2>
            {editingId && (
              <button 
                onClick={() => { setView('manage'); resetForm(); }} 
                className="text-gray-500 font-bold uppercase text-xs hover:text-black transition-colors"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-bold uppercase text-[10px] tracking-widest text-gray-500">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Título impactante da matéria..."
                  className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-[#FF0000] outline-none font-black text-xl transition-all"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold uppercase text-[10px] tracking-widest text-gray-500">Editoria / Categoria *</label>
                <select
                  className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-[#FF0000] outline-none font-bold appearance-none bg-white cursor-pointer transition-all"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as NewsCategory })}
                >
                  {Object.values(NewsCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold uppercase text-[10px] tracking-widest text-gray-500">Resumo (Linha Fina) *</label>
              <textarea
                required
                rows={2}
                placeholder="Texto curto que resume a matéria e aparece no card..."
                className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-[#FF0000] outline-none font-medium leading-relaxed"
                value={formData.summary}
                onChange={e => setFormData({ ...formData, summary: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-bold uppercase text-[10px] tracking-widest text-gray-500">URL da Imagem de Destaque *</label>
                <input
                  type="url"
                  required
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-[#FF0000] outline-none font-medium text-sm transition-all"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold uppercase text-[10px] tracking-widest text-gray-500">Legenda da Foto</label>
                <input
                  type="text"
                  placeholder="Ex: Foto: Divulgação / MaríliaJá"
                  className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-[#FF0000] outline-none font-medium text-sm transition-all"
                  value={formData.imageCaption}
                  onChange={e => setFormData({ ...formData, imageCaption: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-bold uppercase text-[10px] tracking-widest text-gray-500">Assinatura do Autor</label>
              <input
                type="text"
                placeholder="Ex: Por Lucas Repórter - Redação MaríliaJá"
                className="w-full border-2 border-gray-100 p-4 rounded-xl focus:border-[#FF0000] outline-none font-medium text-sm transition-all"
                value={formData.authorSignature}
                onChange={e => setFormData({ ...formData, authorSignature: e.target.value })}
              />
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-2">
              <label className="font-bold uppercase text-[10px] tracking-widest text-gray-500">
                Conteúdo da Notícia (Texto Rico, Imagens, Vídeos e Links) *
              </label>
              <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-[#FF0000] transition-all">
                <ReactQuill 
                  theme="snow"
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['link', 'image', 'video'],
                      ['clean']
                    ],
                  }}
                  className="h-80 mb-12"
                />
              </div>
            </div>

            {/* Ads Fields */}
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 space-y-4">
              <h3 className="font-black uppercase text-sm tracking-wider text-black">
                Campos para ADS (Publicidade na Notícia)
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Insira o código HTML (scripts do AdSense/Banners) ou o link direto da imagem do anúncio.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500">ADS Topo (Acima do conteúdo)</label>
                  <textarea
                    rows={2}
                    placeholder="HTML ou URL da Imagem"
                    className="w-full border-2 border-gray-200 bg-white p-3 rounded-lg text-xs font-mono outline-none focus:border-[#FF0000]"
                    value={formData.adTop}
                    onChange={e => setFormData({ ...formData, adTop: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500">ADS Meio (Dentro do texto)</label>
                  <textarea
                    rows={2}
                    placeholder="HTML ou URL da Imagem"
                    className="w-full border-2 border-gray-200 bg-white p-3 rounded-lg text-xs font-mono outline-none focus:border-[#FF0000]"
                    value={formData.adMiddle}
                    onChange={e => setFormData({ ...formData, adMiddle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500">ADS Lateral (Barra lateral / Sidebar)</label>
                  <textarea
                    rows={2}
                    placeholder="HTML ou URL da Imagem"
                    className="w-full border-2 border-gray-200 bg-white p-3 rounded-lg text-xs font-mono outline-none focus:border-[#FF0000]"
                    value={formData.adSide}
                    onChange={e => setFormData({ ...formData, adSide: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500">ADS Rodapé (Abaixo do conteúdo)</label>
                  <textarea
                    rows={2}
                    placeholder="HTML ou URL da Imagem"
                    className="w-full border-2 border-gray-200 bg-white p-3 rounded-lg text-xs font-mono outline-none focus:border-[#FF0000]"
                    value={formData.adBottom}
                    onChange={e => setFormData({ ...formData, adBottom: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-2xl border-2 border-gray-100">
              <input
                type="checkbox"
                id="isFeatured"
                className="w-6 h-6 rounded-lg accent-[#FF0000] cursor-pointer"
                checked={formData.isFeatured}
                onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
              />
              <label htmlFor="isFeatured" className="font-black uppercase text-sm tracking-tight cursor-pointer select-none">
                Notícia em Destaque (Exibir no Topo da Página Inicial)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF0000] text-white py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl disabled:bg-gray-300 flex items-center justify-center gap-4 uppercase tracking-tighter"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                editingId ? 'Salvar Alterações' : 'Publicar Notícia'
              )}
            </button>
          </form>
        </div>
      )}

      {/* VIEW: MANAGE NEWS */}
      {view === 'manage' && (
        <div>
          {/* Subheader with filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNewsFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${newsFilter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:text-black'}`}
              >
                Todas as Notícias ({newsList.length})
              </button>
              <button
                onClick={() => setNewsFilter('mine')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${newsFilter === 'mine' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:text-black'}`}
              >
                Minhas Notícias ({myPostsCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncToGitHub}
                disabled={syncingGit}
                className="bg-black hover:bg-[#FF0000] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                title="Sincronizar notícias no GitHub"
              >
                <RefreshCw size={12} className={syncingGit ? 'animate-spin' : ''} />
                Sincronizar GitHub
              </button>
              <button
                onClick={() => newsService.downloadNewsJson()}
                className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                title="Baixar arquivo news.json"
              >
                <Download size={12} />
                Baixar JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedNews.map((n) => {
              const isOwner = n.authorId === user.uid;
              const canDelete = isAdmin || isOwner;
              const canEdit = isAdmin || isOwner;

              return (
                <div key={n.id} className="bg-white border-4 border-black flex flex-col h-full group">
                  <div className="relative aspect-video overflow-hidden border-b-4 border-black">
                    <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute top-2 left-2 bg-black text-white text-[8px] font-black uppercase px-2 py-1 tracking-widest">
                      {n.category}
                    </div>
                    {n.isFeatured && (
                      <div className="absolute top-2 right-2 bg-[#FF0000] text-white text-[8px] font-black uppercase px-2 py-1 tracking-widest">
                        DESTAQUE
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-2 line-clamp-2 leading-none">{n.title}</h3>
                    <p className="text-xs text-gray-500 font-bold mb-4 flex-grow line-clamp-2 leading-snug">{n.summary}</p>
                    
                    {/* Author information */}
                    <div className="mb-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span>{n.authorSignature || 'Redação MJ'}</span>
                      {isOwner && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black">
                          Sua Autoria
                        </span>
                      )}
                    </div>

                    <div className="mt-auto">
                      {confirmDeleteId === n.id ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDelete(n.id, n.authorId)}
                            disabled={loading}
                            className="flex-1 bg-red-600 text-white py-3 font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors"
                          >
                            Confirmar Excluir
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-4 bg-gray-200 text-black py-3 font-black text-[10px] uppercase tracking-widest hover:bg-gray-300 transition-colors"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {canEdit ? (
                            <button 
                              onClick={() => handleEdit(n)}
                              className="flex items-center justify-center gap-2 bg-black text-white py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-[#FF0000] transition-colors"
                            >
                              <Edit size={14} /> Editar
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-400 py-2.5 font-bold text-[9px] uppercase tracking-wider">
                              <Lock size={12} /> Somente Leitura
                            </div>
                          )}

                          {canDelete ? (
                            <button 
                              onClick={() => setConfirmDeleteId(n.id)}
                              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-500 py-2.5 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <Trash2 size={14} /> Deletar
                            </button>
                          ) : (
                            <div className="flex items-center justify-center bg-gray-50 text-gray-300 py-2.5 font-bold text-[9px] uppercase tracking-wider cursor-not-allowed">
                              Protegido
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {displayedNews.length === 0 && (
              <div className="col-span-full text-center py-20 border-4 border-dashed border-gray-200 rounded-3xl">
                <p className="font-black text-2xl text-gray-300 uppercase tracking-tighter">
                  {newsFilter === 'mine' ? 'Você ainda não publicou nenhuma notícia.' : 'Nenhuma notícia cadastrada.'}
                </p>
                <button 
                  onClick={() => setView('form')}
                  className="mt-4 text-[#FF0000] font-black uppercase hover:underline text-sm"
                >
                  Clique aqui para criar uma notícia
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
