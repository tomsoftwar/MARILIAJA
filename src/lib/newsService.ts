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
