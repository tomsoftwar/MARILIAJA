export enum NewsCategory {
  POLICIA = 'POLÍCIA',
  POLITICA = 'POLÍTICA',
  CIDADE = 'CIDADE',
  VARIEDADES = 'VARIEDADES',
  REGIAO = 'REGIÃO'
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  imageUrl: string;
  imageCaption?: string;
  authorSignature?: string;
  adTop?: string;
  adMiddle?: string;
  adSide?: string;
  adBottom?: string;
  createdAt: any;
  updatedAt?: any;
  isFeatured?: boolean;
  authorId: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  publishedAt?: string;
  isFeatured?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'editor';
}

export interface Collaborator {
  email: string;
  name?: string;
  role: 'editor' | 'admin';
  password?: string;
  createdAt?: any;
  addedBy?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
