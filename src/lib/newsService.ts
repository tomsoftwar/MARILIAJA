import { NewsArticle, NewsCategory } from '../types';
import { INITIAL_NEWS } from '../data/initialNews';
import { getApps, initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

// Firebase do projeto MARÍLIAJÁ
const firebaseConfig = {
  apiKey: "AIzaSyArzX6-9e8CyROK98-OiPHqnEE3qdVco44",
  authDomain: "mariliaja-94f23.firebaseapp.com",
  projectId: "mariliaja-94f23",
  storageBucket: "mariliaja-94f23.firebasestorage.app",
  messagingSenderId: "720675317766",
  appId: "1:720675317766:web:559e75967a48d6cf00fb87",
  measurementId: "G-N2GPF8NF3D",
};

const firebaseApp = getApps().find(app => app.name === 'mariliaja-news') || initializeApp(firebaseConfig, 'mariliaja-news');
const db = getFirestore(firebaseApp);
const NEWS_COLLECTION = 'noticias';
const STORAGE_KEY = 'mj_news_articles';

type NewsListener = (news: NewsArticle[]) => void;
const listeners: Set<NewsListener> = new Set();
let memoryNews: NewsArticle[] = [];
let isInitialized = false;
let unsubscribeFirestore: (() => void) | null = null;

function notifyListeners(news: NewsArticle[]) {
  listeners.forEach(fn => {
    try { fn(news); } catch (e) { console.error('Erro ao atualizar notícias na tela:', e); }
  });
}

function saveToLocalCache(news: NewsArticle[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(news)); } catch (e) {
    console.warn('Não foi possível salvar o cache local:', e);
  }
}

// Compatibilidade com documentos antigos que possam usar campos em português.
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
    createdAt: raw.createdAt ?? raw.data ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.data ?? new Date().toISOString(),
    isFeatured: Boolean(raw.isFeatured ?? raw.destaque ?? false),
    adTop: raw.adTop ?? '',
    adMiddle: raw.adMiddle ?? '',
    adSide: raw.adSide ?? '',
    adBottom: raw.adBottom ?? '',
  } as NewsArticle;
}

function sortNews(news: NewsArticle[]): NewsArticle[] {
  return [...news].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
}

async function syncWithFirestore(): Promise<NewsArticle[]> {
  try {
    const snapshot = await getDocs(collection(db, NEWS_COLLECTION));
    const articles = sortNews(snapshot.docs.map(item =>
      normalizeArticle(item.id, item.data() as Record<string, any>)
    ));
    memoryNews = articles;
    saveToLocalCache(articles);
    isInitialized = true;
    notifyListeners(articles);
    return articles;
  } catch (error) {
    console.error('Não foi possível carregar notícias do Firestore:', error);
    // Cache é usado somente se o Firestore estiver indisponível.
    if (!isInitialized) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) memoryNews = parsed;
        } else {
          memoryNews = INITIAL_NEWS;
        }
      } catch {
        memoryNews = INITIAL_NEWS;
      }
      notifyListeners(memoryNews);
    }
    return memoryNews;
  }
}

function startRealtimeSync() {
  if (unsubscribeFirestore) return;
  unsubscribeFirestore = onSnapshot(
    collection(db, NEWS_COLLECTION),
    snapshot => {
      memoryNews = sortNews(snapshot.docs.map(item =>
        normalizeArticle(item.id, item.data() as Record<string, any>)
      ));
      saveToLocalCache(memoryNews);
      isInitialized = true;
      notifyListeners(memoryNews);
    },
    error => {
      console.error('Erro na atualização em tempo real do Firestore:', error);
      void syncWithFirestore();
    }
  );
}

if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) memoryNews = parsed;
    }
  } catch { /* cache opcional */ }
  startRealtimeSync();
}

export const newsService = {
  getNews(): NewsArticle[] {
    return sortNews(memoryNews);
  },

  async refreshFromServer(): Promise<NewsArticle[]> {
    return await syncWithFirestore();
  },

  subscribe(callback: NewsListener): () => void {
    listeners.add(callback);
    callback(this.getNews());
    startRealtimeSync();
    if (!isInitialized) void syncWithFirestore();
    return () => listeners.delete(callback);
  },

  getNewsById(id: string): NewsArticle | undefined {
    return this.getNews().find(n => n.id === id);
  },

  getFeaturedNews(): NewsArticle[] {
    const list = this.getNews();
    const featured = list.filter(n => n.isFeatured);
    return featured.length > 0 ? featured : list.slice(0, 1);
  },

  getNewsByCategory(category?: string): NewsArticle[] {
    const list = this.getNews();
    if (!category || category === 'TODAS') return list;
    return list.filter(n => n.category === category);
  },

  // Mantém a assinatura síncrona esperada pela tela; a gravação no Firestore ocorre em seguida.
  saveNews(articleData: Partial<NewsArticle>, authorId: string, editingId?: string | null): NewsArticle {
    const current = this.getNews();
    const now = new Date().toISOString();
    let article: NewsArticle;

    if (editingId) {
      const existing = current.find(n => n.id === editingId);
      if (!existing) throw new Error('Notícia não encontrada para edição.');
      article = { ...existing, ...articleData, id: editingId, updatedAt: now };
    } else {
      article = {
        id: 'mj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: articleData.title || '',
        summary: articleData.summary || '',
        content: articleData.content || '',
        category: articleData.category || NewsCategory.CIDADE,
        imageUrl: articleData.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1000&auto=format&fit=crop',
        imageCaption: articleData.imageCaption || '',
        authorSignature: articleData.authorSignature || '',
        authorId,
        adTop: articleData.adTop || '',
        adMiddle: articleData.adMiddle || '',
        adSide: articleData.adSide || '',
        adBottom: articleData.adBottom || '',
        isFeatured: articleData.isFeatured || false,
        createdAt: now,
        updatedAt: now,
      } as NewsArticle;
    }

    memoryNews = sortNews(editingId
      ? current.map(n => n.id === editingId ? article : n)
      : [article, ...current]);
    saveToLocalCache(memoryNews);
    notifyListeners(memoryNews);

    void setDoc(doc(db, NEWS_COLLECTION, article.id), { ...article })
      .catch(error => {
        console.error('Falha ao salvar notícia no Firestore:', error);
        alert('Não foi possível salvar a notícia no banco de dados. Verifique as regras do Firestore e tente novamente.');
      });
    return article;
  },

  deleteNews(id: string, currentUserId: string, isAdmin: boolean): boolean {
    const current = this.getNews();
    const target = current.find(n => n.id === id);
    if (!target) return false;
    if (!isAdmin && target.authorId !== currentUserId) {
      throw new Error('Permissão negada: colaboradores podem excluir apenas notícias de sua própria autoria.');
    }

    memoryNews = current.filter(n => n.id !== id);
    saveToLocalCache(memoryNews);
    notifyListeners(memoryNews);
    void deleteDoc(doc(db, NEWS_COLLECTION, id)).catch(error => {
      console.error('Falha ao excluir notícia no Firestore:', error);
      alert('Não foi possível excluir a notícia no banco de dados. Verifique as permissões do Firestore.');
    });
    return true;
  },

  async saveAllNews(news: NewsArticle[]): Promise<NewsArticle[]> {
    const cleanNews = news.filter(n => n && n.id);
    const batch = writeBatch(db);
    cleanNews.forEach(article => {
      batch.set(doc(db, NEWS_COLLECTION, article.id), { ...article });
    });
    await batch.commit();
    memoryNews = sortNews(cleanNews);
    saveToLocalCache(memoryNews);
    notifyListeners(memoryNews);
    return memoryNews;
  },

  resetToDefault(): void {
    const batch = writeBatch(db);
    INITIAL_NEWS.forEach(article => {
      batch.set(doc(db, NEWS_COLLECTION, article.id), { ...article });
    });
    void batch.commit().then(() => {
      void syncWithFirestore();
    }).catch(error => {
      console.error('Erro ao restaurar notícias padrão:', error);
      alert('Não foi possível restaurar as notícias padrão no Firestore.');
    });
  },

  downloadNewsJson(): void {
    try {
      const blob = new Blob([JSON.stringify(this.getNews(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'news.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao baixar news.json:', e);
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
