import { NewsArticle, NewsCategory } from '../types';
import { INITIAL_NEWS } from '../data/initialNews';
import { auth, db } from './firebase';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

// Reuse the single Firebase configuration shared by the whole portal.
const NEWS_COLLECTION = 'noticias';
const STORAGE_KEY = 'mj_news_articles';
const DELETED_NEWS_KEY = 'mj_deleted_news_ids';

type NewsListener = (news: NewsArticle[]) => void;
const listeners: Set<NewsListener> = new Set();
let memoryNews: NewsArticle[] = [];
let isInitialized = false;
let unsubscribeFirestore: (() => void) | null = null;

function getDeletedNewsIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_NEWS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    }
  } catch (error) {
    console.warn('Não foi possível ler a lista local de notícias excluídas:', error);
  }
  return new Set<string>();
}

function addDeletedNewsId(id: string): void {
  try {
    const ids = getDeletedNewsIds();
    ids.add(id);
    localStorage.setItem(DELETED_NEWS_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.warn('Não foi possível atualizar a lista local de notícias excluídas:', error);
  }
}

function notifyListeners(news: NewsArticle[]): void {
  listeners.forEach(listener => {
    try { listener(news); }
    catch (error) { console.error('Erro ao atualizar a lista de notícias:', error); }
  });
}

function saveToLocalCache(news: NewsArticle[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(news)); }
  catch (error) { console.warn('Não foi possível salvar o cache local:', error); }
}

function loadFromLocalCache(): NewsArticle[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const deletedIds = getDeletedNewsIds();
        return parsed.filter((item: any) => item && item.id && !deletedIds.has(item.id)) as NewsArticle[];
      }
    }
  } catch (error) {
    console.warn('Não foi possível ler o cache local de notícias:', error);
  }
  const deletedIds = getDeletedNewsIds();
  return INITIAL_NEWS.filter(item => !deletedIds.has(item.id));
}

function normalizeArticle(id: string, raw: Record<string, any>): NewsArticle {
  return {
    ...raw,
    id: raw.id || id,
    title: raw.title ?? raw.titulo ?? '',
    summary: raw.summary ?? raw.resumo ?? '',
    content: raw.content ?? raw.conteudo ?? '',
    category: raw.category ?? raw.categoria ?? NewsCategory.CIDADE,
    imageUrl: raw.imageUrl ?? raw.imagem ?? raw.image ?? '',
    imageCaption: raw.imageCaption ?? raw.legendaImagem ?? '',
    authorSignature: raw.authorSignature ?? raw.autor ?? '',
    authorId: raw.authorId ?? raw.autorId ?? '',
    createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : (raw.createdAt ?? raw.data ?? new Date().toISOString()),
    updatedAt: raw.updatedAt?.toDate ? raw.updatedAt.toDate().toISOString() : (raw.updatedAt ?? raw.data ?? new Date().toISOString()),
    isFeatured: Boolean(raw.isFeatured ?? raw.destaque ?? false),
    adTop: raw.adTop ?? '',
    adMiddle: raw.adMiddle ?? '',
    adSide: raw.adSide ?? '',
    adBottom: raw.adBottom ?? '',
  } as NewsArticle;
}

function sortNews(news: NewsArticle[]): NewsArticle[] {
  return [...news].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

function applyNews(news: NewsArticle[]): NewsArticle[] {
  const deletedIds = getDeletedNewsIds();
  const clean = sortNews(news.filter(item => item && item.id && !deletedIds.has(item.id)));
  memoryNews = clean;
  saveToLocalCache(clean);
  isInitialized = true;
  notifyListeners(clean);
  return clean;
}

async function syncWithFirestore(): Promise<NewsArticle[]> {
  try {
    const snapshot = await getDocs(collection(db, NEWS_COLLECTION));
    const articles = snapshot.docs.map(item => normalizeArticle(item.id, item.data() as Record<string, any>))
      .filter((article: any) => article.published !== false && article.status !== 'draft');
    return applyNews(articles);
  } catch (error) {
    console.error('Não foi possível carregar notícias do Firestore:', error);
    if (!isInitialized) {
      memoryNews = loadFromLocalCache();
      isInitialized = true;
      notifyListeners(memoryNews);
    }
    return memoryNews;
  }
}

function startRealtimeListener(): void {
  if (unsubscribeFirestore) return;
  try {
    unsubscribeFirestore = onSnapshot(collection(db, NEWS_COLLECTION), snapshot => {
      const articles = snapshot.docs.map(item => normalizeArticle(item.id, item.data() as Record<string, any>))
        .filter((article: any) => article.published !== false && article.status !== 'draft');
      applyNews(articles);
    }, error => {
      console.error('Erro na atualização em tempo real das notícias:', error);
      if (!isInitialized) {
        memoryNews = loadFromLocalCache();
        isInitialized = true;
        notifyListeners(memoryNews);
      }
    });
  } catch (error) {
    console.error('Não foi possível iniciar a atualização em tempo real:', error);
  }
}

if (typeof window !== 'undefined') {
  memoryNews = loadFromLocalCache();
  startRealtimeListener();
  void syncWithFirestore();
}

export const newsService = {
  getNews(): NewsArticle[] {
    if (memoryNews.length === 0 && !isInitialized) memoryNews = loadFromLocalCache();
    const deletedIds = getDeletedNewsIds();
    return memoryNews.filter(item => item && item.id && !deletedIds.has(item.id));
  },

  async refreshFromServer(): Promise<NewsArticle[]> {
    return syncWithFirestore();
  },

  subscribe(callback: NewsListener): () => void {
    listeners.add(callback);
    callback(this.getNews());
    startRealtimeListener();
    if (!isInitialized) void syncWithFirestore();
    return () => listeners.delete(callback);
  },

  getNewsById(id: string): NewsArticle | undefined {
    return this.getNews().find(item => item.id === id);
  },

  getFeaturedNews(): NewsArticle[] {
    const news = this.getNews();
    const featured = news.filter(item => item.isFeatured);
    return featured.length ? featured : news.slice(0, 1);
  },

  getNewsByCategory(category?: string): NewsArticle[] {
    const news = this.getNews();
    if (!category || category === 'TODAS') return news;
    return news.filter(item => item.category === category);
  },

  async saveNews(articleData: Partial<NewsArticle>, authorId: string, editingId?: string | null): Promise<NewsArticle> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || firebaseUser.uid !== authorId) {
      throw new Error('Sua sessão do Firebase expirou. Saia do painel e entre novamente com o e-mail e senha cadastrados no Firebase Authentication.');
    }
    const current = this.getNews();
    const now = new Date().toISOString();
    let article: NewsArticle;

    if (editingId) {
      const existing = current.find(item => item.id === editingId);
      if (!existing) throw new Error('Notícia não encontrada para edição. Atualize a lista e tente novamente.');
      article = { ...existing, ...articleData, id: editingId, authorId: existing.authorId, updatedAt: now } as NewsArticle;
    } else {
      article = {
        id: `mj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: articleData.title || '',
        summary: articleData.summary || '',
        content: articleData.content || '',
        category: articleData.category || NewsCategory.CIDADE,
        imageUrl: articleData.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1000&auto=format&fit=crop',
        imageCaption: articleData.imageCaption || '',
        authorSignature: articleData.authorSignature || '',
        authorId: firebaseUser.uid,
        adTop: articleData.adTop || '',
        adMiddle: articleData.adMiddle || '',
        adSide: articleData.adSide || '',
        adBottom: articleData.adBottom || '',
        isFeatured: Boolean(articleData.isFeatured),
        createdAt: now,
        updatedAt: now,
      } as NewsArticle;
    }

    // Only report success after Firestore confirms the write. Never show a local-only article as published.
    const payload: Record<string, any> = {
      ...article,
      authorId: firebaseUser.uid,
      published: true,
      status: 'published',
      updatedAt: serverTimestamp(),
    };
    if (!editingId) payload.createdAt = serverTimestamp();
    await setDoc(doc(db, NEWS_COLLECTION, article.id), payload, { merge: true });

    const publishedArticle = { ...article, published: true, status: 'published' } as NewsArticle;
    const updated = editingId
      ? current.map(item => item.id === editingId ? publishedArticle : item)
      : [publishedArticle, ...current];
    applyNews(updated);
    return publishedArticle;
  },

  deleteNews(id: string, currentUserId: string, isAdmin: boolean): boolean {
    const current = this.getNews();
    const target = current.find(item => item.id === id);
    if (!target) return false;
    if (!isAdmin && target.authorId !== currentUserId) {
      throw new Error('Permissão negada: colaboradores podem excluir apenas notícias de sua própria autoria.');
    }

    addDeletedNewsId(id);
    const filtered = current.filter(item => item.id !== id);
    memoryNews = filtered;
    saveToLocalCache(filtered);
    notifyListeners(filtered);
    void deleteDoc(doc(db, NEWS_COLLECTION, id)).catch(error => {
      console.error('Falha ao excluir notícia no Firestore:', error);
    });
    return true;
  },

  async saveAllNews(news: NewsArticle[]): Promise<NewsArticle[]> {
    const deletedIds = getDeletedNewsIds();
    const cleanNews = sortNews(news.filter(item => item && item.id && !deletedIds.has(item.id)));
    try {
      // Firestore limita cada lote a 500 operações; processamos lotes menores.
      for (let start = 0; start < cleanNews.length; start += 400) {
        const batch = writeBatch(db);
        cleanNews.slice(start, start + 400).forEach(item => {
          batch.set(doc(db, NEWS_COLLECTION, item.id), { ...item });
        });
        await batch.commit();
      }
      applyNews(cleanNews);
      return cleanNews;
    } catch (error) {
      console.error('Erro ao salvar todas as notícias no Firestore:', error);
      throw error;
    }
  },

  resetToDefault(): void {
    try { localStorage.removeItem(DELETED_NEWS_KEY); } catch { /* cache opcional */ }
    memoryNews = [...INITIAL_NEWS];
    saveToLocalCache(memoryNews);
    notifyListeners(memoryNews);
    void (async () => {
      try {
        for (let start = 0; start < INITIAL_NEWS.length; start += 400) {
          const batch = writeBatch(db);
          INITIAL_NEWS.slice(start, start + 400).forEach(item => {
            batch.set(doc(db, NEWS_COLLECTION, item.id), { ...item });
          });
          await batch.commit();
        }
      } catch (error) {
        console.error('Erro ao restaurar as notícias iniciais no Firestore:', error);
      }
    })();
  },

  downloadNewsJson(): void {
    try {
      const data = this.getNews();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'news.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error downloading news.json:", e);
    }
  },

  // Sync to GitHub CMS
  async syncWithGitHub(config: { githubToken: string; repo: string; branch: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanToken = config.githubToken ? config.githubToken.trim().replace(/^['"]|['"]$/g, '') : '';
      if (!cleanToken) {
        return { success: false, error: "Token de acesso pessoal do GitHub não informado." };
      }

      const repoPath = config.repo.trim();
      const branch = config.branch?.trim() || 'main';
      const filePath = 'public/data/news.json';

      // 1. Get current file sha from GitHub
      let currentSha = '';
      const getFileRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${filePath}?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        currentSha = fileData.sha;
      }

      // 2. Prepare payload
      const newsToCommit = this.getNews();
      const contentString = JSON.stringify(newsToCommit, null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(contentString)));

      // 3. Put to GitHub
      const putRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `CMS Update: Publicadas/atualizadas ${newsToCommit.length} notícias [Portal MaríliaJá]`,
          content: contentBase64,
          branch: branch,
          ...(currentSha ? { sha: currentSha } : {})
        })
      });

      if (!putRes.ok) {
        const errJson = await putRes.json();
        return { success: false, error: errJson.message || `Erro HTTP ${putRes.status}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro inesperado ao sincronizar com GitHub" };
    }
  },

  // One-click Auto Repair for GitHub Pages White Screen
  async repairGitHubPagesWorkflow(config: { githubToken: string; repo: string; branch: string }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const cleanToken = config.githubToken ? config.githubToken.trim().replace(/^['"]|['"]$/g, '') : '';
      if (!cleanToken) {
        return { success: false, error: "Token de acesso pessoal do GitHub não informado." };
      }

      const repoPath = config.repo.trim();
      const branch = config.branch?.trim() || 'main';
      const headers = {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      const results: string[] = [];

      // 1. Install correct .github/workflows/deploy.yml
      const deployYaml = `name: Deploy Portal MaríliaJá to GitHub Pages

on:
  push:
    branches: ["${branch}"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

      const deployPath = '.github/workflows/deploy.yml';
      let deploySha = '';
      const getDeployRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${deployPath}?ref=${branch}`, { headers });
      if (getDeployRes.ok) {
        const data = await getDeployRes.json();
        deploySha = data.sha;
      }

      const deployBase64 = btoa(unescape(encodeURIComponent(deployYaml)));
      const putDeployRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${deployPath}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'ci: configurar build automatico do Vite para GitHub Pages [Resolve tela branca]',
          content: deployBase64,
          branch,
          ...(deploySha ? { sha: deploySha } : {})
        })
      });

      if (!putDeployRes.ok) {
        const errJson = await putDeployRes.json();
        return { success: false, error: `Erro ao criar workflow de deploy: ${errJson.message}` };
      }
      results.push('Workflow de compilação (.github/workflows/deploy.yml) atualizado com --legacy-peer-deps');

      // 2. Remove problematic static.yml (which uploaded uncompiled code and caused white screen)
      const staticPath = '.github/workflows/static.yml';
      const getStaticRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${staticPath}?ref=${branch}`, { headers });
      if (getStaticRes.ok) {
        const data = await getStaticRes.json();
        if (data.sha) {
          const delRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/${staticPath}`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({
              message: 'fix: remover static.yml conflitante que enviava codigo sem compilar',
              sha: data.sha,
              branch
            })
          });
          if (delRes.ok) {
            results.push('Arquivo estático conflitante (static.yml) removido com sucesso');
          }
        }
      }

      // 3. Fix index.html in repo if it has typo "./src./main.tsx"
      const getIndexRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/index.html?ref=${branch}`, { headers });
      if (getIndexRes.ok) {
        const data = await getIndexRes.json();
        if (data.content && data.sha) {
          const decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
          if (decoded.includes('src./main.tsx') || decoded.includes('./src./main.tsx')) {
            const fixedHtml = decoded.replace(/\.\/src\.\/main\.tsx/g, '/src/main.tsx').replace(/src\.\/main\.tsx/g, '/src/main.tsx');
            const fixedBase64 = btoa(unescape(encodeURIComponent(fixedHtml)));
            await fetch(`https://api.github.com/repos/${repoPath}/contents/index.html`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                message: 'fix: corrigir caminho do script no index.html para /src/main.tsx',
                content: fixedBase64,
                sha: data.sha,
                branch
              })
            });
            results.push('index.html corrigido (caminho do script)');
          }
        }
      }

      // 4. Fix package.json in repo if it has conflicting react-quill dependency
      const getPkgRes = await fetch(`https://api.github.com/repos/${repoPath}/contents/package.json?ref=${branch}`, { headers });
      if (getPkgRes.ok) {
        const data = await getPkgRes.json();
        if (data.content && data.sha) {
          const decodedPkg = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
          if (decodedPkg.includes('"react-quill":')) {
            const fixedPkg = decodedPkg.replace(/\s*"react-quill":\s*"[^"]*",?/g, '');
            const fixedPkgBase64 = btoa(unescape(encodeURIComponent(fixedPkg)));
            await fetch(`https://api.github.com/repos/${repoPath}/contents/package.json`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                message: 'fix: remover react-quill conflitante com React 19 no package.json',
                content: fixedPkgBase64,
                sha: data.sha,
                branch
              })
            });
            results.push('package.json atualizado (removida dependência conflitante)');
          }
        }
      }

      // 5. Also trigger sync of news.json
      await this.syncWithGitHub(config);
      results.push('Dados de notícias atualizados no GitHub');

      return {
        success: true,
        message: `Correção enviada ao GitHub com sucesso! Ações executadas: ${results.join('; ')}.`
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro ao corrigir configuração do GitHub Pages" };
    }
  }
};
