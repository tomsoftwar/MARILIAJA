import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsCategory, NewsArticle, Collaborator, YouTubeVideo } from '../types';
import { newsService } from '../lib/newsService';
import { videoService, extractYouTubeId } from '../lib/videoService';
import { adService, PortalAdsConfig } from '../lib/adService';
import { authService, AuthUser } from '../lib/authService';
import { syncEntireProjectToGitHub, downloadProjectZip } from '../lib/projectSyncService';
import { 
  Trash2, Edit, Plus, LayoutGrid, X, Users, UserPlus, 
  Shield, CheckCircle2, Lock, UserCheck, Download, Github, 
  RefreshCw, Settings, KeyRound, AlertCircle, Tv, Video, Play, ExternalLink, Megaphone, Save,
  AlertTriangle, Wrench, Sparkles, UploadCloud, Check, Package
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
  const [videoList, setVideoList] = useState<YouTubeVideo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<'manage' | 'form' | 'collaborators' | 'github' | 'videos' | 'ads'>('manage');
  const [newsFilter, setNewsFilter] = useState<'all' | 'mine'>('all');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteCollabEmail, setConfirmDeleteCollabEmail] = useState<string | null>(null);
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<string | null>(null);

  // Portal Ads form state
  const [adsFormData, setAdsFormData] = useState<PortalAdsConfig>({
    homeTop: '',
    homeGrid: '',
    homeBottom: ''
  });

  // TV Marília Já form state
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    youtubeUrl: '',
    description: '',
    isFeatured: false
  });
  const [videoLoading, setVideoLoading] = useState(false);
  const [hasDeletedVideos, setHasDeletedVideos] = useState(false);
  const [savingAllVideos, setSavingAllVideos] = useState(false);
  const [hasDeletedNews, setHasDeletedNews] = useState(false);
  const [savingAllNews, setSavingAllNews] = useState(false);

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
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [userCurrentPass, setUserCurrentPass] = useState('');
  const [userNewPass, setUserNewPass] = useState('');
  const [userConfirmPass, setUserConfirmPass] = useState('');
  const [passModalError, setPassModalError] = useState<string | null>(null);
  const [editingCollabPassEmail, setEditingCollabPassEmail] = useState<string | null>(null);
  const [newCollabPass, setNewCollabPass] = useState('');

  // GitHub Sync state
  const [githubSettings, setGithubSettings] = useState(authService.getGitHubSettings());
  const [syncingGit, setSyncingGit] = useState(false);
  const [syncingServer, setSyncingServer] = useState(false);
  const [repairingGit, setRepairingGit] = useState(false);
  const [syncingAllProject, setSyncingAllProject] = useState(false);
  const [syncProgressMessage, setSyncProgressMessage] = useState<string | null>(null);

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

    // Subscribe to TV Marília Já videos
    const unsubVideos = videoService.subscribe((vids) => {
      setVideoList(vids);
    });

    // Subscribe to Portal Ads
    const unsubAds = adService.subscribe((ads) => {
      setAdsFormData(ads);
    });

    // Load collaborators
    setCollaboratorsList(authService.getCollaborators());

    return () => {
      unsubNews();
      unsubVideos();
      unsubAds();
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
      setHasDeletedNews(true);
      setSuccessStatus("Notícia excluída da lista! Clique no botão verde 'SALVAR ALTERAÇÕES' para gravar permanentemente no servidor e impedir que retorne.");
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao excluir notícia.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllNews = async () => {
    setSavingAllNews(true);
    setErrorStatus(null);
    setSuccessStatus(null);
    try {
      const updated = await newsService.saveAllNews(newsList);
      setNewsList(updated);
      setHasDeletedNews(false);
      setSuccessStatus("Sucesso! Lista de notícias gravada com segurança no servidor. As notícias excluídas foram eliminadas permanentemente.");
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao salvar notícias no servidor.");
    } finally {
      setSavingAllNews(false);
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
      setShowPasswordSuccessModal(true);
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
      setShowPasswordSuccessModal(true);
      setEditingCollabPassEmail(null);
      setNewCollabPass('');
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao alterar senha do colaborador.");
    }
  };

  const handleUserChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassModalError(null);

    if (userNewPass !== userConfirmPass) {
      setPassModalError("A nova senha e a confirmação não coincidem.");
      return;
    }

    try {
      authService.changeUserPassword(user.email, userCurrentPass, userNewPass);
      setUserCurrentPass('');
      setUserNewPass('');
      setUserConfirmPass('');
      setShowChangePasswordModal(false);
      setSuccessStatus("SENHA ALTERADA COM SUCESSO!");
      setShowPasswordSuccessModal(true);
    } catch (err: any) {
      setPassModalError(err.message || "Erro ao alterar a senha.");
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

  const handleSyncToServer = async () => {
    setSyncingServer(true);
    setErrorStatus(null);
    setSuccessStatus(null);
    try {
      const refreshed = await newsService.refreshFromServer();
      setNewsList(refreshed);
      setSuccessStatus(`Sincronização concluída! ${refreshed.length} notícias atualizadas no servidor e disponíveis para todos os celulares e computadores.`);
    } catch {
      setErrorStatus("Erro ao sincronizar com o servidor.");
    } finally {
      setSyncingServer(false);
    }
  };

  const handleSyncToGitHub = async () => {
    if (!githubSettings.token) {
      setErrorStatus("Por favor, informe seu GitHub Token no formulário abaixo.");
      setView('github');
      return;
    }

    setSyncingGit(true);
    setSyncProgressMessage("Sincronizando todo o projeto (TV Marília Já, 3 Colunas, ADS, Vídeos e Notícias) com o GitHub...");
    setErrorStatus(null);
    setSuccessStatus(null);

    const result = await syncEntireProjectToGitHub({
      githubToken: githubSettings.token,
      repo: githubSettings.repo,
      branch: githubSettings.branch,
      onProgress: (msg) => setSyncProgressMessage(msg)
    });

    setSyncingGit(false);
    setSyncProgressMessage(null);
    if (result.success) {
      setSuccessStatus(`Sucesso! Todo o portal (TV Marília Já, 3 Colunas, vídeos e notícias) foi enviado ao GitHub! O GitHub Actions já iniciou o build e seu site estará no ar em 1 minuto.`);
    } else {
      setErrorStatus(`Falha na sincronização: ${result.error}`);
    }
  };

  const handleRepairGitHubPages = async () => {
    if (!githubSettings.token) {
      setErrorStatus("Informe o seu GitHub Personal Access Token (com permissão 'repo') no formulário abaixo para corrigir o GitHub Pages.");
      return;
    }

    setRepairingGit(true);
    setErrorStatus(null);
    setSuccessStatus(null);

    const result = await newsService.repairGitHubPagesWorkflow({
      githubToken: githubSettings.token,
      repo: githubSettings.repo,
      branch: githubSettings.branch
    });

    setRepairingGit(false);
    if (result.success) {
      setSuccessStatus(result.message || "Configurações do GitHub Pages reparadas com sucesso! Em 1 a 2 minutos o site estará online sem tela branca.");
    } else {
      setErrorStatus(`Falha na reparação: ${result.error}`);
    }
  };

  const handleSyncEntireProject = async () => {
    if (!githubSettings.token) {
      setErrorStatus("Informe o seu GitHub Personal Access Token (com permissão 'repo') no formulário abaixo.");
      return;
    }

    setSyncingAllProject(true);
    setSyncProgressMessage("Iniciando comunicação com o GitHub...");
    setErrorStatus(null);
    setSuccessStatus(null);

    const result = await syncEntireProjectToGitHub({
      githubToken: githubSettings.token,
      repo: githubSettings.repo,
      branch: githubSettings.branch,
      onProgress: (msg) => setSyncProgressMessage(msg)
    });

    setSyncingAllProject(false);
    setSyncProgressMessage(null);
    if (result.success) {
      setSuccessStatus(result.message || "Projeto sincronizado com sucesso com o GitHub!");
    } else {
      setErrorStatus(`Falha na sincronização completa: ${result.error}`);
    }
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setVideoLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);
    try {
      videoService.saveVideo(videoFormData);
      setSuccessStatus("Vídeo publicado com sucesso na TV Marília Já!");
      setVideoFormData({
        title: '',
        youtubeUrl: '',
        description: '',
        isFeatured: false
      });
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao adicionar vídeo do YouTube.");
    } finally {
      setVideoLoading(false);
    }
  };

  const handleDeleteVideo = (id: string) => {
    try {
      videoService.deleteVideo(id);
      setConfirmDeleteVideoId(null);
      setHasDeletedVideos(true);
      setSuccessStatus("Vídeo excluído da lista! Clique no botão verde 'SALVAR ALTERAÇÕES' para confirmar a gravação permanente no servidor.");
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao remover vídeo.");
    }
  };

  const handleSaveAllVideos = async () => {
    setSavingAllVideos(true);
    setErrorStatus(null);
    setSuccessStatus(null);
    try {
      const updated = await videoService.saveAllVideos(videoList);
      setVideoList(updated);
      setHasDeletedVideos(false);
      setSuccessStatus("Sucesso! Lista de vídeos gravada com segurança no servidor. Os vídeos excluídos foram eliminados permanentemente.");
    } catch (err: any) {
      setErrorStatus(err.message || "Erro ao salvar vídeos no servidor.");
    } finally {
      setSavingAllVideos(false);
    }
  };

  const handleSaveAds = (e: React.FormEvent) => {
    e.preventDefault();
    adService.saveAds(adsFormData);
    setSuccessStatus("Banners publicitários da página inicial salvos com sucesso!");
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
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl w-full max-w-full overflow-hidden box-border">
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
            <button
              type="button"
              onClick={() => {
                setPassModalError(null);
                setUserCurrentPass('');
                setUserNewPass('');
                setUserConfirmPass('');
                setShowChangePasswordModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-black text-white hover:bg-[#FF0000] px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Alterar minha senha de acesso"
            >
              <KeyRound size={12} /> Alterar Senha
            </button>
            <button
              type="button"
              onClick={handleSyncToServer}
              disabled={syncingServer}
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Sincronizar notícias com o servidor (celular e computadores)"
            >
              <RefreshCw size={12} className={syncingServer ? 'animate-spin' : ''} />
              {syncingServer ? 'Sincronizando...' : 'Sincronizar Celular / Servidor'}
            </button>
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
          <button 
            onClick={() => { setView('videos'); resetForm(); }}
            className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'videos' ? 'bg-[#FF0000] text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
          >
            <Tv size={16} /> TV MaríliaJá ({videoList.length})
          </button>
          <button 
            onClick={() => { setView('ads'); resetForm(); }}
            className={`px-5 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'ads' ? 'bg-[#FF0000] text-white shadow-lg' : 'text-gray-500 hover:text-black'}`}
          >
            <Megaphone size={16} /> Banners / ADS
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

      {/* Top Sync & Status Bar (Always Visible in all views) */}
      <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
          <div>
            <p className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-2">
              Sincronização Celular e Computador
              <span className="bg-emerald-200 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold">ONLINE</span>
            </p>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
              {newsList.length} notícias sincronizadas no servidor central, visíveis em qualquer celular ou computador.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncToServer}
          disabled={syncingServer}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          <RefreshCw size={15} className={syncingServer ? 'animate-spin' : ''} />
          {syncingServer ? 'Sincronizando...' : 'Sincronizar Celular / Servidor'}
        </button>
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

            {/* DIAGNOSTIC & AUTO REPAIR FOR WHITE SCREEN */}
            <div className="bg-red-50 border-4 border-red-500 p-6 rounded-2xl mb-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-600 text-white rounded-xl shrink-0 mt-1">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="text-lg font-black uppercase text-red-900 tracking-tight flex items-center gap-2">
                      Diagnóstico: Por que o GitHub Pages está com Tela Branca?
                    </h3>
                    <p className="text-xs text-red-800 font-bold mt-1 leading-relaxed">
                      O GitHub Pages foi configurado no GitHub com um fluxo estático (arquivo <code>static.yml</code> enviando a raiz do repositório). Em projetos React + Vite, o navegador não consegue abrir arquivos TypeScript (<code>.tsx</code>) brutos sem compilação, resultando em tela totalmente branca.
                    </p>
                  </div>

                  <div className="bg-white/80 p-4 rounded-xl border border-red-200 text-xs text-red-950 font-medium space-y-2">
                    <p className="font-bold text-red-900 uppercase tracking-wide">
                      A Solução Definitiva em 2 Passos:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 pl-1">
                      <li>
                        <strong>Passo 1 (Automático pelo botão abaixo):</strong> Criar o workflow do Vite (<code>.github/workflows/deploy.yml</code>) que compila automaticamente a pasta <code>dist</code> e remover o <code>static.yml</code> conflitante.
                      </li>
                      <li>
                        <strong>Passo 2 (No GitHub.com):</strong> Acesse o repositório em <code>Settings &gt; Pages</code> e altere a opção <em>Source</em> para <strong>GitHub Actions</strong>.
                      </li>
                    </ol>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRepairGitHubPages}
                      disabled={repairingGit}
                      className="bg-red-600 hover:bg-black text-white px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400 cursor-pointer active:scale-95"
                    >
                      {repairingGit ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          Reparando Configuração no GitHub...
                        </>
                      ) : (
                        <>
                          <Wrench size={18} />
                          🚀 Corrigir e Ativar GitHub Pages Automaticamente
                        </>
                      )}
                    </button>

                    <a 
                      href="https://github.com/tomsoftwar/mariliaja/settings/pages" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-zinc-900 hover:bg-black text-white px-5 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-zinc-700"
                    >
                      <ExternalLink size={16} /> Abrir Configurações do GitHub Pages
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* FULL PROJECT SYNC CARD (TV MARILIA JA, 3 COLUMNS, ADS, ALL CODE) */}
            <div className="bg-gradient-to-br from-zinc-900 to-black text-white border-4 border-black p-6 rounded-2xl mb-8 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#FF0000] text-white rounded-xl shrink-0 mt-1 shadow-lg">
                  <UploadCloud size={28} />
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <span className="bg-[#FF0000] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                      Atualização do Código Fonte
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                      Sincronizar Portal Completo para o GitHub
                    </h3>
                    <p className="text-xs text-gray-300 font-medium mt-1 leading-relaxed">
                      Seu repositório do GitHub foi criado anteriormente e não continha os arquivos novos da <strong>TV MARÍLIA JÁ</strong>, o layout com <strong>3 colunas de notícias</strong> e os <strong>espaços para anúncios ADS</strong>. Clique no botão abaixo para enviar todo o código atualizado em 1 clique!
                    </p>
                  </div>

                  {syncProgressMessage && (
                    <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2">
                      <RefreshCw className="animate-spin text-amber-400" size={16} />
                      <span>{syncProgressMessage}</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSyncEntireProject}
                      disabled={syncingAllProject}
                      className="bg-[#FF0000] hover:bg-white hover:text-black text-white px-7 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 disabled:bg-gray-700 cursor-pointer active:scale-95"
                    >
                      {syncingAllProject ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          Enviando Código Completo ao GitHub...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          🚀 Sincronizar Todo o Código Atualizado para o GitHub
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <button
                type="button"
                onClick={handleSyncToGitHub}
                disabled={syncingGit}
                className="bg-[#FF0000] text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-300 cursor-pointer"
              >
                {syncingGit ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                Sincronizar no GitHub
              </button>

              <button
                type="button"
                onClick={() => downloadProjectZip()}
                className="bg-zinc-900 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg border border-zinc-700 cursor-pointer"
              >
                <Package size={16} />
                Baixar Projeto (.ZIP)
              </button>

              <button
                type="button"
                onClick={() => newsService.downloadNewsJson()}
                className="bg-black text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Download size={16} />
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-1.5">
                  <p className="text-[10px] text-gray-400">
                    O token fica salvo apenas no seu navegador para atualizar as notícias e o código do portal.
                  </p>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=Portal%20Marilia%20Ja"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-black text-[#FF0000] hover:text-black flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink size={12} /> Gerar Token no GitHub Agora
                  </a>
                </div>
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

      {/* VIEW: TV MARÍLIA JÁ (YOUTUBE VIDEOS MANAGEMENT) */}
      {view === 'videos' && (
        <div className="space-y-10">
          {/* Add Video Card */}
          <div className="bg-gray-50 border-4 border-black p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 text-[#FF0000] rounded-xl border-2 border-red-200">
                <Tv size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Publicar Vídeo na TV Marília Já</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Adicione vídeos do YouTube para serem exibidos na seção da TV na página inicial.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    Link do YouTube ou ID do Vídeo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://www.youtube.com/watch?v=... ou ID"
                    className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold focus:border-[#FF0000] outline-none text-sm"
                    value={videoFormData.youtubeUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, youtubeUrl: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Suporta links de vídeos normais, Shorts ou links compartilhados do YouTube.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    Título do Vídeo na TV Marília Já *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reportagem Especial: Nova Praça do Centro"
                    className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-bold focus:border-[#FF0000] outline-none text-sm"
                    value={videoFormData.title}
                    onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Descrição / Resumo do Vídeo (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve descrição da reportagem ou cobertura..."
                  className="w-full border-2 border-gray-200 bg-white p-3.5 rounded-xl font-medium focus:border-[#FF0000] outline-none text-xs"
                  value={videoFormData.description}
                  onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border-2 border-gray-200">
                <input
                  type="checkbox"
                  id="videoIsFeatured"
                  className="w-5 h-5 accent-[#FF0000] cursor-pointer"
                  checked={videoFormData.isFeatured}
                  onChange={(e) => setVideoFormData({ ...videoFormData, isFeatured: e.target.checked })}
                />
                <label htmlFor="videoIsFeatured" className="text-xs font-black uppercase tracking-wider cursor-pointer">
                  Marcar como Destaque Principal da TV Marília Já
                </label>
              </div>

              <button
                type="submit"
                disabled={videoLoading}
                className="bg-[#FF0000] hover:bg-black text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                {videoLoading ? 'Publicando...' : 'Adicionar Vídeo à TV Marília Já'}
              </button>
            </form>
          </div>

          {/* List of Published YouTube Videos */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 mb-6 gap-3">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Tv size={20} className="text-[#FF0000]" />
                  Vídeos Publicados na TV Marília Já ({videoList.length})
                </h3>
                <span className="text-xs text-gray-400 font-bold uppercase">
                  Exibidos na Home do Portal
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveAllVideos}
                disabled={savingAllVideos}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
                title="Gravar a lista atual de vídeos permanentemente no servidor"
              >
                <Save size={16} />
                {savingAllVideos ? 'Gravando no Servidor...' : 'Salvar Lista de Vídeos'}
              </button>
            </div>

            {/* Aviso e Botão de Salvar em Destaque ao Deletar Vídeos */}
            {hasDeletedVideos && (
              <div className="bg-amber-50 border-3 border-amber-400 p-4 sm:p-5 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 font-black">
                    <AlertCircle size={22} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-black uppercase text-amber-950 tracking-wide">
                      Vídeos foram deletados da lista!
                    </p>
                    <p className="text-xs text-amber-900 font-bold mt-0.5">
                      Para garantir que os vídeos excluídos nunca mais retornem, clique no botão ao lado para salvar permanentemente no servidor.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllVideos}
                  disabled={savingAllVideos}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer shrink-0"
                >
                  <Save size={16} />
                  {savingAllVideos ? 'Salvando...' : 'SALVAR ALTERAÇÕES AGORA'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoList.map((vid) => {
                const thumb = `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`;

                return (
                  <div key={vid.id} className="bg-white border-4 border-black rounded-2xl overflow-hidden flex flex-col shadow-sm group">
                    {/* Thumbnail & YouTube link */}
                    <div className="relative aspect-video bg-black overflow-hidden border-b-2 border-black">
                      <img 
                        src={thumb} 
                        alt={vid.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${vid.youtubeId}/0.jpg`;
                        }}
                      />
                      <a
                        href={vid.youtubeUrl || `https://www.youtube.com/watch?v=${vid.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors text-white"
                        title="Assistir no YouTube"
                      >
                        <div className="p-3 bg-[#FF0000] rounded-full shadow-lg">
                          <Play size={18} fill="currentColor" />
                        </div>
                      </a>
                      {vid.isFeatured && (
                        <span className="absolute top-2 left-2 bg-[#FF0000] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                          Destaque
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight line-clamp-2 mb-1.5 leading-snug">
                          {vid.title}
                        </h4>
                        {vid.description && (
                          <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-3">
                            {vid.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                        <a
                          href={vid.youtubeUrl || `https://www.youtube.com/watch?v=${vid.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-gray-500 hover:text-[#FF0000] inline-flex items-center gap-1 uppercase"
                        >
                          <ExternalLink size={11} /> Ver no YouTube
                        </a>

                        {confirmDeleteVideoId === vid.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteVideo(vid.id)}
                              className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-1 rounded"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteVideoId(null)}
                              className="text-[10px] font-bold text-gray-500 px-1"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteVideoId(vid.id)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors"
                            title="Excluir vídeo"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {videoList.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 sm:p-5 rounded-2xl border-2 border-gray-200">
                <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Total de {videoList.length} {videoList.length === 1 ? 'vídeo ativo' : 'vídeos ativos'} na TV Marília Já
                </span>
                <button
                  type="button"
                  onClick={handleSaveAllVideos}
                  disabled={savingAllVideos}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Save size={16} />
                  {savingAllVideos ? 'Gravando no Servidor...' : 'Salvar Lista de Vídeos Permanentemente'}
                </button>
              </div>
            )}

            {videoList.length === 0 && (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="font-black text-gray-400 uppercase text-sm">
                  Nenhum vídeo cadastrado na TV Marília Já ainda.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: PORTAL ADS MANAGEMENT */}
      {view === 'ads' && (
        <div className="space-y-8">
          <div className="bg-gray-50 border-4 border-black p-6 md:p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 text-[#FF0000] rounded-xl border-2 border-red-200">
                <Megaphone size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Publicidade e Banners da Página Inicial</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Configure os 3 espaços de publicidade da capa do portal: Topo, Lateral (ao lado da seção Região) e Rodapé.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAds} className="space-y-6">
              {/* ADS Top */}
              <div className="bg-white p-5 rounded-2xl border-2 border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#FF0000] inline-block"></span>
                    1. ADS Superior (Super Banner Retangular no Topo)
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Horizontal</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  Exibido no topo da página inicial logo abaixo do menu. Cole a URL da imagem ou código HTML/Script do anunciante.
                </p>
                <textarea
                  rows={2}
                  placeholder="https://exemplo.com/banner-topo.jpg ou código <script> / <iframe>"
                  className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-xl font-mono text-xs focus:border-[#FF0000] focus:bg-white outline-none"
                  value={adsFormData.homeTop || ''}
                  onChange={(e) => setAdsFormData({ ...adsFormData, homeTop: e.target.value })}
                />
              </div>

              {/* ADS Grid (Beside Região) */}
              <div className="bg-white p-5 rounded-2xl border-2 border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#FF0000] inline-block"></span>
                    2. ADS Lateral da Grade (Coluna ao lado da seção REGIÃO)
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Coluna 3</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  Preenche a 3ª coluna ao lado de Região na grade da página inicial. Cole a URL da imagem ou código HTML.
                </p>
                <textarea
                  rows={2}
                  placeholder="https://exemplo.com/banner-lateral.jpg ou código <script> / <iframe>"
                  className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-xl font-mono text-xs focus:border-[#FF0000] focus:bg-white outline-none"
                  value={adsFormData.homeGrid || ''}
                  onChange={(e) => setAdsFormData({ ...adsFormData, homeGrid: e.target.value })}
                />
              </div>

              {/* ADS Bottom */}
              <div className="bg-white p-5 rounded-2xl border-2 border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#FF0000] inline-block"></span>
                    3. ADS Inferior (Super Banner Retangular Acima do Rodapé)
                  </label>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Horizontal</span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium">
                  Exibido no final da página inicial logo antes do rodapé. Cole a URL da imagem ou código HTML/Script.
                </p>
                <textarea
                  rows={2}
                  placeholder="https://exemplo.com/banner-rodape.jpg ou código <script> / <iframe>"
                  className="w-full border-2 border-gray-200 bg-gray-50 p-3 rounded-xl font-mono text-xs focus:border-[#FF0000] focus:bg-white outline-none"
                  value={adsFormData.homeBottom || ''}
                  onChange={(e) => setAdsFormData({ ...adsFormData, homeBottom: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-800 font-medium">
                💡 <strong>Dica:</strong> Se deixar qualquer um dos campos em branco, o portal exibirá automaticamente o anúncio visual padrão de convite para patrocinadores com link direto para a página &quot;Anuncie no MJ&quot;.
              </div>

              <button
                type="submit"
                className="bg-[#FF0000] hover:bg-black text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Salvar Banners Publicitários
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

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSaveAllNews}
                disabled={savingAllNews}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Gravar a lista atual de notícias permanentemente no servidor"
              >
                <Save size={14} />
                {savingAllNews ? 'Gravando no Servidor...' : 'Salvar Lista de Notícias'}
              </button>
              <button
                onClick={handleSyncToServer}
                disabled={syncingServer}
                className="bg-zinc-800 hover:bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Sincronizar notícias com o servidor central"
              >
                <RefreshCw size={12} className={syncingServer ? 'animate-spin' : ''} />
                {syncingServer ? 'Sincronizando...' : 'Sincronizar Servidor'}
              </button>
              <button
                onClick={handleSyncToGitHub}
                disabled={syncingGit}
                className="bg-black hover:bg-[#FF0000] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Sincronizar notícias no GitHub"
              >
                <RefreshCw size={12} className={syncingGit ? 'animate-spin' : ''} />
                Sincronizar GitHub
              </button>
              <button
                onClick={() => newsService.downloadNewsJson()}
                className="bg-gray-100 hover:bg-gray-200 text-black px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Baixar arquivo news.json"
              >
                <Download size={12} />
                Baixar JSON
              </button>
            </div>
          </div>

          {/* Aviso e Botão de Salvar em Destaque ao Deletar Notícias */}
          {hasDeletedNews && (
            <div className="bg-amber-50 border-3 border-amber-400 p-4 sm:p-5 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 font-black">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black uppercase text-amber-950 tracking-wide">
                    Notícias foram deletadas da lista!
                  </p>
                  <p className="text-xs text-amber-900 font-bold mt-0.5">
                    Para garantir que as notícias excluídas nunca mais retornem, clique no botão ao lado para salvar permanentemente no servidor.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveAllNews}
                disabled={savingAllNews}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer shrink-0"
              >
                <Save size={16} />
                {savingAllNews ? 'Salvando...' : 'SALVAR ALTERAÇÕES AGORA'}
              </button>
            </div>
          )}

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

      {/* POP-UP MODAL NO CENTRO DA TELA: SENHA ALTERADA COM SUCESSO! */}
      {showPasswordSuccessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowPasswordSuccessModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border-4 border-black shadow-2xl text-center relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            {/* Botão de Fechar */}
            <button 
              type="button"
              onClick={() => setShowPasswordSuccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              aria-label="Fechar aviso"
            >
              <X size={20} />
            </button>

            {/* Ícone de Sucesso */}
            <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-400 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>

            {/* Texto exato solicitado: SENHA ALTERADA COM SUCESSO! */}
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 mb-2">
              SENHA ALTERADA COM SUCESSO!
            </h3>

            <p className="text-xs text-gray-600 font-bold mb-6 leading-relaxed">
              Sua nova senha de acesso foi salva e já está ativa para os próximos logins.
            </p>

            <button
              type="button"
              onClick={() => setShowPasswordSuccessModal(false)}
              className="w-full bg-[#FF0000] text-white hover:bg-black font-black uppercase text-xs tracking-widest py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              OK, Entendido
            </button>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: FORMULÁRIO DE ALTERAÇÃO DE SENHA */}
      {showChangePasswordModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowChangePasswordModal(false)}
        >
          <div 
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border-4 border-black shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button 
              type="button"
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-50 text-[#FF0000] border-2 border-red-200 rounded-xl">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                  Alterar Senha de Acesso
                </h3>
                <p className="text-xs text-gray-500 font-bold">
                  {user.displayName || user.email}
                </p>
              </div>
            </div>

            {passModalError && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-4 text-xs font-bold border-2 border-red-200 flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{passModalError}</span>
              </div>
            )}

            <form onSubmit={handleUserChangePassword} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Senha Atual *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Digite sua senha atual"
                  className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-[#FF0000] transition-colors"
                  value={userCurrentPass}
                  onChange={(e) => setUserCurrentPass(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-[#FF0000] transition-colors"
                  value={userNewPass}
                  onChange={(e) => setUserNewPass(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repita a nova senha"
                  className="w-full border-2 border-gray-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-[#FF0000] transition-colors"
                  value={userConfirmPass}
                  onChange={(e) => setUserConfirmPass(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#FF0000] hover:bg-black text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md cursor-pointer"
                >
                  Salvar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
