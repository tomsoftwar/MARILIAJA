import { NewsArticle, NewsCategory } from '../types';
import { INITIAL_NEWS } from '../data/initialNews';

const STORAGE_KEY = 'mj_news_articles';
type NewsListener = (news: NewsArticle[]) => void;
const listeners: Set<NewsListener> = new Set();

function notifyListeners(news: NewsArticle[]) {
  listeners.forEach(fn => {
    try {
      fn(news);
    } catch (e) {
      console.error("Error in news listener:", e);
    }
  });
}

export const newsService = {
  // Get all news, initializing with INITIAL_NEWS if empty
  getNews(): NewsArticle[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load news from localStorage:", e);
    }

    // Default to INITIAL_NEWS
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NEWS));
    return INITIAL_NEWS;
  },

  // Subscribe to changes (replaces onSnapshot from Firestore!)
  subscribe(callback: NewsListener): () => void {
    listeners.add(callback);
    // Immediately call with current news
    callback(this.getNews());
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

    if (editingId) {
      // Update
      const index = current.findIndex(n => n.id === editingId);
      if (index === -1) throw new Error("Notícia não encontrada para edição.");

      const existing = current[index];
      const updated: NewsArticle = {
        ...existing,
        ...articleData,
        id: editingId,
        authorId: existing.authorId || authorId,
        updatedAt: now
      } as NewsArticle;

      current[index] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      notifyListeners(current);
      return updated;
    } else {
      // Create
      const newArticle: NewsArticle = {
        id: 'mj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: articleData.title || '',
        summary: articleData.summary || '',
        content: articleData.content || '',
        category: (articleData.category as NewsCategory) || NewsCategory.CIDADE,
        imageUrl: articleData.imageUrl || '',
        imageCaption: articleData.imageCaption || '',
        authorSignature: articleData.authorSignature || '',
        adTop: articleData.adTop || '',
        adMiddle: articleData.adMiddle || '',
        adSide: articleData.adSide || '',
        adBottom: articleData.adBottom || '',
        isFeatured: articleData.isFeatured || false,
        authorId: authorId,
        createdAt: now,
        updatedAt: now
      };

      const updated = [newArticle, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      notifyListeners(updated);
      return newArticle;
    }
  },

  deleteNews(id: string, currentUserId: string, isAdmin: boolean): boolean {
    const current = this.getNews();
    const target = current.find(n => n.id === id);
    if (!target) return false;

    // Rule: Admin can delete all, Collaborator can delete ONLY their own!
    if (!isAdmin && target.authorId !== currentUserId) {
      throw new Error("Permissão negada: Colaboradores podem deletar apenas notícias de sua própria autoria.");
    }

    const filtered = current.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    notifyListeners(filtered);
    return true;
  },

  // Reset to initial seed data
  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NEWS));
    notifyListeners(INITIAL_NEWS);
  },

  // Export current news as JSON string (for committing to GitHub)
  exportNewsJson(): string {
    return JSON.stringify(this.getNews(), null, 2);
  },

  // Trigger a browser download of news.json
  downloadNewsJson(): void {
    const jsonStr = this.exportNewsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'news.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Commit news.json directly to GitHub repository via GitHub REST API!
  async syncWithGitHub(options: {
    githubToken: string;
    repo: string; // e.g. "usuario/meu-portal"
    filePath?: string; // default: "public/data/news.json"
    branch?: string; // default: "main"
    commitMessage?: string;
  }): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
    const { githubToken, repo, filePath = 'public/data/news.json', branch = 'main', commitMessage = 'Atualizar notícias do portal (via CMS)' } = options;

    if (!githubToken) throw new Error("Token do GitHub não fornecido.");
    if (!repo || !repo.includes('/')) throw new Error("Repositório inválido. Formato esperado: 'usuario/repositorio'");

    try {
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
      
      // 1. Get existing file sha if it exists
      let sha: string | undefined = undefined;
      const getRes = await fetch(apiUrl + `?ref=${branch}`, {
        headers: {
          'Authorization': `Bearer ${githubToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      });

      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // 2. Prepare payload with UTF-8 base64 encoding
      const contentStr = this.exportNewsJson();
      // Browser UTF-8 base64 encoding
      const base64Content = btoa(unescape(encodeURIComponent(contentStr)));

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          branch,
          ...(sha ? { sha } : {})
        })
      });

      if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Erro do GitHub API: status ${putRes.status}`);
      }

      const putData = await putRes.json();
      return {
        success: true,
        commitUrl: putData.commit?.html_url
      };
    } catch (err: any) {
      console.error("GitHub Sync Error:", err);
      return {
        success: false,
        error: err.message || "Erro desconhecido ao sincronizar com o GitHub."
      };
    }
  }
};
