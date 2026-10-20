import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Collaborator, UserProfile } from '../types';

export interface AuthUser extends UserProfile {
  githubToken?: string;
}

const USER_SESSION_KEY = 'mj_auth_user';
const COLLABORATORS_KEY = 'mj_collaborators';
const GITHUB_SETTINGS_KEY = 'mj_github_settings';
const MASTER_PASSWORD_KEY = 'mj_admin_master_password';

// Initial default master password for tomsoftwar / admin
const DEFAULT_MASTER_PASSWORD = 'Re970838$';

type AuthListener = (user: AuthUser | null) => void;
const authListeners: Set<AuthListener> = new Set();

const DEFAULT_COLLABORATORS: Collaborator[] = [
  {
    email: 'tomsoftwar@gmail.com',
    name: 'TomSoft (Master Admin)',
    role: 'admin',
    password: DEFAULT_MASTER_PASSWORD,
    createdAt: new Date().toISOString(),
    addedBy: 'system'
  },
  {
    email: 'portalmariliaja@gmail.com',
    name: 'Portal Marília Já',
    role: 'admin',
    password: DEFAULT_MASTER_PASSWORD,
    createdAt: new Date().toISOString(),
    addedBy: 'system'
  },
  {
    email: 'mendsassessoria@gmail.com',
    name: 'Mends Assessoria',
    role: 'admin',
    password: DEFAULT_MASTER_PASSWORD,
    createdAt: new Date().toISOString(),
    addedBy: 'system'
  }
];

function notifyAuth(user: AuthUser | null) {
  authListeners.forEach(fn => fn(user));
}

async function syncAuthWithServer() {
  try {
    const res = await fetch('/api/auth/settings');
    if (res.ok) {
      const data = await res.json();
      if (data && data.masterPassword) {
        localStorage.setItem(MASTER_PASSWORD_KEY, data.masterPassword);
      }
      if (data && Array.isArray(data.collaborators) && data.collaborators.length > 0) {
        localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(data.collaborators));
      }
    }
  } catch {
    // quiet fallback
  }
}

function pushAuthToServer() {
  try {
    const masterPassword = localStorage.getItem(MASTER_PASSWORD_KEY) || DEFAULT_MASTER_PASSWORD;
    const collabs = localStorage.getItem(COLLABORATORS_KEY);
    const parsedCollabs = collabs ? JSON.parse(collabs) : DEFAULT_COLLABORATORS;
    fetch('/api/auth/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterPassword, collaborators: parsedCollabs })
    }).catch(() => {});
  } catch {
    // quiet fallback
  }
}

if (typeof window !== 'undefined') {
  syncAuthWithServer();
}

export const authService = {
  getCurrentUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      if (!stored) return null;
      const cached = JSON.parse(stored) as AuthUser;
      // Never trust a browser-only session as proof of Firebase authentication.
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || firebaseUser.uid !== cached.uid) {
        localStorage.removeItem(USER_SESSION_KEY);
        return null;
      }
      return { ...cached, uid: firebaseUser.uid, email: firebaseUser.email || cached.email };
    } catch (e) {
      console.warn("Error reading user session:", e);
      localStorage.removeItem(USER_SESSION_KEY);
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

  getMasterPassword(): string {
    return localStorage.getItem(MASTER_PASSWORD_KEY) || DEFAULT_MASTER_PASSWORD;
  },

  changeMasterPassword(currentPassword: string, newPassword: string): boolean {
    const current = this.getMasterPassword();
    if (currentPassword !== current) {
      throw new Error("A senha atual informada está incorreta.");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("A nova senha deve conter no mínimo 6 caracteres.");
    }
    localStorage.setItem(MASTER_PASSWORD_KEY, newPassword);
    pushAuthToServer();
    return true;
  },

  changeUserPassword(emailOrId: string, currentPassword: string, newPassword: string): boolean {
    const clean = (emailOrId || '').toLowerCase().trim();
    const isMasterAdmin = 
      clean === 'admin' || 
      clean === 'tomsoftwar' || 
      clean === 'tomsoftwar@gmail.com' || 
      clean === 'mendsassessoria@gmail.com';

    if (isMasterAdmin) {
      return this.changeMasterPassword(currentPassword, newPassword);
    }

    const collabs = this.getCollaborators();
    const index = collabs.findIndex(c => c.email.toLowerCase() === clean);
    if (index === -1) {
      throw new Error("Usuário não encontrado.");
    }

    const currentExpected = collabs[index].password || this.getMasterPassword();
    if (currentPassword !== currentExpected) {
      throw new Error("A senha atual informada está incorreta.");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("A nova senha deve conter no mínimo 6 caracteres.");
    }

    collabs[index].password = newPassword;
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(collabs));
    pushAuthToServer();
    return true;
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

  addCollaborator(collaborator: { email: string; name?: string; role: 'editor' | 'admin'; password?: string; addedBy?: string }): Collaborator {
    const list = this.getCollaborators();
    const cleanEmail = collaborator.email.toLowerCase().trim();

    if (list.some(c => c.email.toLowerCase() === cleanEmail)) {
      throw new Error(`O colaborador com e-mail/usuário "${cleanEmail}" já está cadastrado.`);
    }

    if (!collaborator.password || collaborator.password.length < 4) {
      throw new Error("Defina uma senha de acesso para o colaborador (mínimo 4 caracteres).");
    }

    const newCollab: Collaborator = {
      email: cleanEmail,
      name: collaborator.name?.trim() || cleanEmail,
      role: collaborator.role,
      password: collaborator.password,
      addedBy: collaborator.addedBy || 'admin',
      createdAt: new Date().toISOString()
    };

    const updated = [newCollab, ...list];
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(updated));
    pushAuthToServer();
    return newCollab;
  },

  updateCollaboratorPassword(email: string, newPassword: string): void {
    if (!newPassword || newPassword.length < 4) {
      throw new Error("A senha deve conter no mínimo 4 caracteres.");
    }
    const list = this.getCollaborators();
    const cleanEmail = email.toLowerCase().trim();
    const index = list.findIndex(c => c.email.toLowerCase() === cleanEmail);
    if (index === -1) throw new Error("Colaborador não encontrado.");

    list[index].password = newPassword;
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(list));
    pushAuthToServer();
  },

  removeCollaborator(email: string): void {
    const list = this.getCollaborators();
    const filtered = list.filter(c => c.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem(COLLABORATORS_KEY, JSON.stringify(filtered));
    pushAuthToServer();
  },

  // Authenticate against Firebase Authentication; localStorage is only a UI session cache.
  async login(identifier: string, password?: string): Promise<AuthUser> {
    const cleanId = identifier.toLowerCase().trim();
    if (!cleanId || !password) throw new Error("Informe o e-mail e a senha cadastrados no Firebase Authentication.");
    if (!cleanId.includes('@')) throw new Error("Use o e-mail cadastrado no Firebase Authentication para entrar no painel.");

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanId, password);
      const firebaseUser = credential.user;
      const [adminSnap, profileSnap] = await Promise.all([
        getDoc(doc(db, 'admins', firebaseUser.uid)),
        getDoc(doc(db, 'users', firebaseUser.uid))
      ]);
      const isAdmin = adminSnap.exists() && adminSnap.data()?.ativo === true;
      const profile = profileSnap.exists() ? profileSnap.data() : {};
      const role = isAdmin || profile.role === 'admin' ? 'admin' : profile.role === 'editor' ? 'editor' : null;
      if (!role) {
        await signOut(auth);
        throw new Error('Seu e-mail autenticou, mas não tem permissão para publicar. No Firestore, cadastre admins/SEU_UID com o campo ativo = true, ou um perfil users/SEU_UID com role = admin/editor.');
      }
      const user: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || cleanId,
        displayName: firebaseUser.displayName || profile.name || firebaseUser.email || cleanId,
        role
      };
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      notifyAuth(user);
      return user;
    } catch (error: any) {
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
        throw new Error('E-mail ou senha incorretos no Firebase Authentication.');
      }
      if (error?.code === 'auth/operation-not-allowed') {
        throw new Error('Ative o provedor E-mail/senha em Firebase Authentication → Método de login.');
      }
      throw error;
    }
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

      if (!isMasterAdmin && !collab) {
        throw new Error(`A conta do GitHub @${ghUser.login} não está cadastrada como colaborador no portal.`);
      }

      const role: 'admin' | 'editor' = (isMasterAdmin || collab?.role === 'admin') ? 'admin' : 'editor';

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
    void signOut(auth).catch(() => {});
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
    return { repo: 'tomsoftwar/mariliaja', branch: 'main', token: '' };
  },

  saveGitHubSettings(settings: { repo: string; branch: string; token: string }): void {
    localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(settings));
  }
};
