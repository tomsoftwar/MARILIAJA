import { Collaborator, UserProfile } from '../types';

export interface AuthUser extends UserProfile {
  githubToken?: string;
}

const USER_SESSION_KEY = 'mj_auth_user';
const COLLABORATORS_KEY = 'mj_collaborators';
const GITHUB_SETTINGS_KEY = 'mj_github_settings';

type AuthListener = (user: AuthUser | null) => void;
const authListeners: Set<AuthListener> = new Set();

const DEFAULT_COLLABORATORS: Collaborator[] = [
  {
    email: 'tomsoftwar@gmail.com',
    name: 'TomSoft (Master Admin)',
    role: 'admin',
    createdAt: new Date().toISOString(),
    addedBy: 'system'
  },
  {
    email: 'mendsassessoria@gmail.com',
    name: 'Mends Assessoria',
    role: 'admin',
    createdAt: new Date().toISOString(),
    addedBy: 'system'
  }
];

function notifyAuth(user: AuthUser | null) {
  authListeners.forEach(fn => fn(user));
}

export const authService = {
  getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error reading user session:", e);
    }
    return null;
  },

  subscribe(callback: AuthListener): () => void {
    authListeners.add(callback);
    callback(this.getCurrentUser());
    return () => {
      authListeners.delete(callback);
    };
  },

  getCollaborators(): Collaborator[] {
    try {
      const stored = localStorage.getItem(COLLABORATORS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Error reading collaborators:", e);
    }
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(DEFAULT_COLLABORATORS));
    return DEFAULT_COLLABORATORS;
  },

  addCollaborator(collaborator: { email: string; name?: string; role: 'editor' | 'admin'; addedBy?: string }): Collaborator {
    const list = this.getCollaborators();
    const cleanEmail = collaborator.email.toLowerCase().trim();

    if (list.some(c => c.email.toLowerCase() === cleanEmail)) {
      throw new Error(`O colaborador com e-mail/usuário "${cleanEmail}" já está cadastrado.`);
    }

    const newCollab: Collaborator = {
      email: cleanEmail,
      name: collaborator.name?.trim() || cleanEmail,
      role: collaborator.role,
      addedBy: collaborator.addedBy || 'admin',
      createdAt: new Date().toISOString()
    };

    const updated = [newCollab, ...list];
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(updated));
    return newCollab;
  },

  removeCollaborator(email: string): void {
    const list = this.getCollaborators();
    const filtered = list.filter(c => c.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(filtered));
  },

  // Login with Email or Username and Password
  login(identifier: string, password?: string): AuthUser {
    const cleanId = identifier.toLowerCase().trim();
    if (!cleanId) throw new Error("Informe seu e-mail ou nome de usuário.");

    // 1. Check Master Admins
    const isMasterAdmin = 
      cleanId === 'admin' || 
      cleanId === 'tomsoftwar' || 
      cleanId === 'tomsoftwar@gmail.com' || 
      cleanId === 'mendsassessoria@gmail.com';

    if (isMasterAdmin) {
      const user: AuthUser = {
        uid: 'admin-' + cleanId,
        email: cleanId.includes('@') ? cleanId : `${cleanId}@mariliaja.com.br`,
        displayName: cleanId === 'admin' ? 'Administrador Master' : cleanId,
        role: 'admin'
      };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      notifyAuth(user);
      return user;
    }

    // 2. Check registered collaborators
    const collabs = this.getCollaborators();
    const found = collabs.find(c => c.email.toLowerCase() === cleanId);

    if (found) {
      const user: AuthUser = {
        uid: 'user-' + found.email.replace(/[^a-zA-Z0-9]/g, '_'),
        email: found.email,
        displayName: found.name || found.email,
        role: found.role
      };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      notifyAuth(user);
      return user;
    }

    throw new Error(`Acesso Não Autorizado. O identificador "${cleanId}" não está cadastrado na lista de colaboradores.`);
  },

  // Login with GitHub Personal Access Token (PAT)
  async loginWithGitHub(token: string): Promise<AuthUser> {
    const cleanToken = token.trim();
    if (!cleanToken) throw new Error("Informe o seu GitHub Personal Access Token.");

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        throw new Error("Token do GitHub inválido ou expirado. Verifique as permissões de repo.");
      }

      const ghUser = await res.json();
      const login = (ghUser.login || '').toLowerCase();
      const email = (ghUser.email || `${login}@github.com`).toLowerCase();

      // Check if user is master admin or in collaborators
      const isMasterAdmin = login === 'tomsoftwar' || email === 'tomsoftwar@gmail.com' || email === 'mendsassessoria@gmail.com';
      const collabs = this.getCollaborators();
      const collab = collabs.find(c => c.email.toLowerCase() === email || c.email.toLowerCase() === login);

      const role: 'admin' | 'editor' = (isMasterAdmin || collab?.role === 'admin') ? 'admin' : (collab ? 'editor' : 'admin');

      const user: AuthUser = {
        uid: 'gh-' + ghUser.id,
        email: email,
        displayName: ghUser.name || ghUser.login,
        role: role,
        githubToken: cleanToken
      };

      // Save user session
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));

      // Save token in GitHub settings for auto commit sync
      const settings = this.getGitHubSettings();
      this.saveGitHubSettings({ ...settings, token: cleanToken });

      notifyAuth(user);
      return user;
    } catch (e: any) {
      console.error("GitHub Login Error:", e);
      throw new Error(e.message || "Erro ao autenticar com o GitHub.");
    }
  },

  signOut(): void {
    localStorage.removeItem(USER_SESSION_KEY);
    notifyAuth(null);
  },

  // GitHub Repository Settings for 1-click sync
  getGitHubSettings(): { repo: string; branch: string; token: string } {
    try {
      const stored = localStorage.getItem(GITHUB_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return { repo: 'tomsoftwar/portal-mariliaja', branch: 'main', token: '' };
  },

  saveGitHubSettings(settings: { repo: string; branch: string; token: string }): void {
    localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(settings));
  }
};
