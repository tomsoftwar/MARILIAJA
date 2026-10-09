import { NewsArticle, NewsCategory } from '../types';
import { INITIAL_NEWS } from '../data/initialNews';

const STORAGE_KEY = 'mj_news_articles';
const DELETED_NEWS_KEY = 'mj_deleted_news_ids';

type NewsListener = (news: NewsArticle[]) => void;
const listeners: Set<NewsListener> = new Set();

let memoryNews: NewsArticle[] = [];
let isInitialized = false;

function getDeletedNewsIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_NEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {
    console.warn("Failed to load deleted news ids:", e);
  }
  return new Set();
}

function addDeletedNewsId(id: string) {
  try {
    const set = getDeletedNewsIds();
    set.add(id);
    localStorage.setItem(DELETED_NEWS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn("Failed to save deleted news id:", e);
  }
}

function notifyListeners(news: NewsArticle[]) {
  listeners.forEach(fn => {
    try {
      fn(news);
    } catch (e) {
      console.error("Error in news listener:", e);
    }
  });
}

function loadFromLocalCache(): NewsArticle[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const deletedIds = getDeletedNewsIds();
        return parsed.filter(n => n && n.id && !deletedIds.has(n.id));
      }
    }
  } catch (e) {
    console.warn("Failed to load news from localStorage:", e);
  }
  const deletedIds = getDeletedNewsIds();
  return INITIAL_NEWS.filter(n => !deletedIds.has(n.id));
}

function saveToLocalCache(news: NewsArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
  } catch (e) {
    console.warn("Failed to save news to localStorage:", e);
  }
}

// Multi-device server sync engine - Authoritative from server, NEVER resurrects deleted news
async function syncWithServer(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('/api/news');
    if (res.ok) {
      const serverNews: NewsArticle[] = await res.json();
      if (Array.isArray(serverNews)) {
        const deletedIds = getDeletedNewsIds();
        // Strictly filter out any article deleted by the user
        const cleanServerNews = serverNews.filter(n => n && n.id && !deletedIds.has(n.id));

        // If the server had articles marked as deleted locally, purge them from the server too!
        if (cleanServerNews.length !== serverNews.length) {
          await fetch('/api/news/replace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ news: cleanServerNews })
          }).catch(e => console.error("Error purging deleted news on server:", e));
        }

        memoryNews = cleanServerNews;
        saveToLocalCache(cleanServerNews);
        notifyListeners(cleanServerNews);
        return cleanServerNews;
      }
    }
  } catch (err) {
    console.warn("Could not connect to /api/news server, checking static data fallback:", err);
  }

  // Fallback for static hosting like GitHub Pages where /api/news is not available
  try {
    const staticRes = await fetch('./data/news.json');
    if (staticRes.ok) {
      const staticNews: NewsArticle[] = await staticRes.json();
      if (Array.isArray(staticNews) && staticNews.length > 0) {
        const deletedIds = getDeletedNewsIds();
        const cleanStaticNews = staticNews.filter(n => n && n.id && !deletedIds.has(n.id));
        if (cleanStaticNews.length > 0 && memoryNews.length === 0) {
          memoryNews = cleanStaticNews;
          saveToLocalCache(cleanStaticNews);
          notifyListeners(cleanStaticNews);
          return cleanStaticNews;
        }
      }
    }
  } catch (e) {
    // quiet fallback
  }

  if (memoryNews.length === 0 && !isInitialized) {
    memoryNews = loadFromLocalCache();
    notifyListeners(memoryNews);
  }
  return memoryNews;
}

// Initial sync on startup
if (typeof window !== 'undefined') {
  memoryNews = loadFromLocalCache();
  syncWithServer().then(() => {
    isInitialized = true;
  });

  // Re-sync on focus/visibility
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncWithServer();
    }
  });

  window.addEventListener('focus', () => {
    syncWithServer();
  });
}

export const newsService = {
  // Get all news, filtering out any deleted IDs
  getNews(): NewsArticle[] {
    if (memoryNews.length === 0 && !isInitialized) {
      memoryNews = loadFromLocalCache();
    }
    const deletedIds = getDeletedNewsIds();
    return memoryNews.filter(n => n && n.id && !deletedIds.has(n.id));
  },

  // Force an immediate reload from the server
  async refreshFromServer(): Promise<NewsArticle[]> {
    return await syncWithServer();
  },

  // Subscribe to changes
  subscribe(callback: NewsListener): () => void {
    listeners.add(callback);
    callback(this.getNews());

    if (!isInitialized) {
      syncWithServer().then(news => callback(news));
    }

    return () => {
      listeners.delete(callback);
    };
  },

  getNewsById(id: string): NewsArticle | undefined {
    const list = this.getNews();
    return list.find(n => n.id === id);
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

  saveNews(articleData: Partial<NewsArticle>, authorId: string, editingId?: string | null): NewsArticle {
    const current = this.getNews();
    const now = new Date().toISOString();
    let targetArticle: NewsArticle;

    if (editingId) {
      const index = current.findIndex(n => n.id === editingId);
      if (index === -1) throw new Error("Notícia não encontrada para edição.");

      targetArticle = {
        ...current[index],
        ...articleData,
        updatedAt: now
      };

      current[index] = targetArticle;
    } else {
      targetArticle = {
        id: 'mj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: articleData.title || '',
        summary: articleData.summary || '',
        content: articleData.content || '',
        category: articleData.category || NewsCategory.CIDADE,
        imageUrl: articleData.imageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1000&auto=format&fit=crop',
        imageCaption: articleData.imageCaption || '',
        authorSignature: articleData.authorSignature || '',
        authorId: authorId,
        adTop: articleData.adTop || '',
        adMiddle: articleData.adMiddle || '',
        adSide: articleData.adSide || '',
        adBottom: articleData.adBottom || '',
        isFeatured: articleData.isFeatured || false,
        createdAt: now,
        updatedAt: now
      };

      current.unshift(targetArticle);
    }

    memoryNews = [...current];
    saveToLocalCache(memoryNews);
    notifyListeners(memoryNews);

    // Save to server
    fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetArticle)
    }).catch(err => {
      console.error("Failed to save news to server:", err);
    });

    return targetArticle;
  },

  deleteNews(id: string, currentUserId: string, isAdmin: boolean): boolean {
    const current = this.getNews();
    const target = current.find(n => n.id === id);
    if (!target) return false;

    // Rule: Admin can delete all, Collaborator can delete ONLY their own!
    if (!isAdmin && target.authorId !== currentUserId) {
      throw new Error("Permissão negada: Colaboradores podem deletar apenas notícias de sua própria autoria.");
    }

    // 1. Mark id in permanent deleted tombstones
    addDeletedNewsId(id);

    // 2. Filter from memory
    const filtered = current.filter(n => n.id !== id);
    memoryNews = filtered;

    // 3. Save to localStorage
    saveToLocalCache(filtered);
    notifyListeners(filtered);

    // 4. Remove from server permanently via both DELETE and replace
    fetch(`/api/news/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(err => {
      console.error("Failed to delete news from server:", err);
    });

    fetch('/api/news/replace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news: filtered })
    }).catch(err => {
      console.error("Failed to replace news on server:", err);
    });

    return true;
  },

  // Authoritatively save all news to server and cache
  async saveAllNews(news: NewsArticle[]): Promise<NewsArticle[]> {
    const deletedIds = getDeletedNewsIds();
    const cleanNews = news.filter(n => n && n.id && !deletedIds.has(n.id));

    memoryNews = cleanNews;
    saveToLocalCache(cleanNews);
    notifyListeners(cleanNews);

    try {
      const res = await fetch('/api/news/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news: cleanNews })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.news)) {
          memoryNews = data.news;
          saveToLocalCache(data.news);
          notifyListeners(data.news);
          return data.news;
        }
      }
    } catch (e) {
      console.error("Error saving all news to server:", e);
    }

    return cleanNews;
  },

  // Reset to initial seed data
  resetToDefault(): void {
    try {
      localStorage.removeItem(DELETED_NEWS_KEY);
    } catch (e) {}
    memoryNews = INITIAL_NEWS;
    saveToLocalCache(INITIAL_NEWS);
    notifyListeners(INITIAL_NEWS);

    fetch('/api/news/replace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news: INITIAL_NEWS })
    }).catch(e => console.error("Error resetting news on server:", e));
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
