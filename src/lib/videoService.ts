import { YouTubeVideo } from '../types';
import { INITIAL_VIDEOS } from '../data/initialVideos';

const STORAGE_KEY = 'mj_tv_videos';
const DELETED_KEY = 'mj_tv_deleted_video_ids';

type VideoListener = (videos: YouTubeVideo[]) => void;
const listeners: Set<VideoListener> = new Set();

let memoryVideos: YouTubeVideo[] = [];
let isInitialized = false;

export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return '';
  const clean = urlOrId.trim();

  // If already an 11-char ID without slashes or query params
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Handle standard youtube.com/watch?v=ID, youtu.be/ID, shorts, embed
  const matchWatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (matchWatch && matchWatch[1]) {
    return matchWatch[1];
  }

  return clean;
}

function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (e) {
    console.warn("Failed to load deleted ids:", e);
  }
  return new Set();
}

function addDeletedId(id: string) {
  try {
    const set = getDeletedIds();
    set.add(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn("Failed to save deleted id:", e);
  }
}

function notifyListeners(videos: YouTubeVideo[]) {
  listeners.forEach(fn => {
    try {
      fn(videos);
    } catch (e) {
      console.error("Error in video listener:", e);
    }
  });
}

function loadFromLocalCache(): YouTubeVideo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // If the key exists in localStorage (even as []), respect it!
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const deletedIds = getDeletedIds();
        return parsed.filter(v => v && v.id && !deletedIds.has(v.id));
      }
    }
  } catch (e) {
    console.warn("Failed to load videos from localStorage:", e);
  }
  return INITIAL_VIDEOS;
}

function saveToLocalCache(videos: YouTubeVideo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  } catch (e) {
    console.warn("Failed to save videos to localStorage:", e);
  }
}

async function syncWithServer(): Promise<YouTubeVideo[]> {
  try {
    const res = await fetch('/api/videos');
    if (res.ok) {
      const serverVideos: YouTubeVideo[] = await res.json();
      if (Array.isArray(serverVideos)) {
        const deletedIds = getDeletedIds();
        // Crucial: Filter out ANY video that was ever deleted by the user!
        const filtered = serverVideos.filter(v => v && v.id && !deletedIds.has(v.id));

        // If the server still had deleted videos, purge them from the server too!
        if (filtered.length !== serverVideos.length) {
          await fetch('/api/videos/replace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videos: filtered })
          }).catch(e => console.error("Error cleaning deleted videos on server:", e));
        }

        memoryVideos = filtered;
        saveToLocalCache(filtered);
        notifyListeners(filtered);
        return filtered;
      }
    }
  } catch (err) {
    console.warn("Could not connect to /api/videos server, checking static data fallback:", err);
  }

  // Fallback for static hosting like GitHub Pages where /api/videos is not available
  try {
    const staticRes = await fetch('./data/videos.json');
    if (staticRes.ok) {
      const staticVideos: YouTubeVideo[] = await staticRes.json();
      if (Array.isArray(staticVideos) && staticVideos.length > 0) {
        const deletedIds = getDeletedIds();
        const cleanStaticVideos = staticVideos.filter(v => v && v.id && !deletedIds.has(v.id));
        if (cleanStaticVideos.length > 0 && memoryVideos.length === 0) {
          memoryVideos = cleanStaticVideos;
          saveToLocalCache(cleanStaticVideos);
          notifyListeners(cleanStaticVideos);
          return cleanStaticVideos;
        }
      }
    }
  } catch (e) {
    // quiet fallback
  }

  if (memoryVideos.length === 0 && !isInitialized) {
    memoryVideos = loadFromLocalCache();
    notifyListeners(memoryVideos);
  }
  return memoryVideos;
}

if (typeof window !== 'undefined') {
  memoryVideos = loadFromLocalCache();
  syncWithServer().then(() => {
    isInitialized = true;
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncWithServer();
    }
  });

  window.addEventListener('focus', () => {
    syncWithServer();
  });
}

export const videoService = {
  getVideos(): YouTubeVideo[] {
    if (memoryVideos.length === 0 && !isInitialized) {
      memoryVideos = loadFromLocalCache();
    }
    const deletedIds = getDeletedIds();
    return memoryVideos.filter(v => v && v.id && !deletedIds.has(v.id));
  },

  async refreshFromServer(): Promise<YouTubeVideo[]> {
    return await syncWithServer();
  },

  subscribe(callback: VideoListener): () => void {
    listeners.add(callback);
    callback(this.getVideos());

    if (!isInitialized) {
      syncWithServer().then(v => callback(v));
    }

    return () => {
      listeners.delete(callback);
    };
  },

  saveVideo(videoData: Partial<YouTubeVideo>, editingId?: string | null): YouTubeVideo {
    const current = this.getVideos();
    const now = new Date().toISOString();
    const ytId = extractYouTubeId(videoData.youtubeUrl || videoData.youtubeId || '');

    if (!ytId) {
      throw new Error("Link ou ID do vídeo do YouTube inválido.");
    }

    let targetVideo: YouTubeVideo;

    if (editingId) {
      const index = current.findIndex(v => v.id === editingId);
      if (index === -1) throw new Error("Vídeo não encontrado para edição.");

      targetVideo = {
        ...current[index],
        ...videoData,
        youtubeId: ytId,
        youtubeUrl: videoData.youtubeUrl || `https://www.youtube.com/watch?v=${ytId}`
      };
      current[index] = targetVideo;
    } else {
      targetVideo = {
        id: 'video-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: videoData.title || 'Vídeo TV Marília Já',
        description: videoData.description || '',
        youtubeUrl: videoData.youtubeUrl || `https://www.youtube.com/watch?v=${ytId}`,
        youtubeId: ytId,
        publishedAt: now,
        isFeatured: videoData.isFeatured || false
      };
      current.unshift(targetVideo);
    }

    memoryVideos = [...current];
    saveToLocalCache(memoryVideos);
    notifyListeners(memoryVideos);

    // Save to server
    fetch('/api/videos/replace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos: memoryVideos })
    }).catch(e => console.error("Error saving videos to server:", e));

    return targetVideo;
  },

  deleteVideo(id: string): boolean {
    // 1. Mark id in deleted tombstones permanently
    addDeletedId(id);

    // 2. Filter from memory
    const current = this.getVideos();
    const filtered = current.filter(v => v.id !== id);
    memoryVideos = filtered;

    // 3. Save to localStorage
    saveToLocalCache(filtered);
    notifyListeners(filtered);

    // 4. Delete on server via both DELETE /api/videos/:id and POST /api/videos/replace
    fetch(`/api/videos/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(e => console.error("Error deleting video from server:", e));

    fetch('/api/videos/replace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videos: filtered })
    }).catch(e => console.error("Error updating video list on server:", e));

    return true;
  },

  async saveAllVideos(videos: YouTubeVideo[]): Promise<YouTubeVideo[]> {
    const deletedIds = getDeletedIds();
    const cleanVideos = videos.filter(v => v && v.id && !deletedIds.has(v.id));

    memoryVideos = cleanVideos;
    saveToLocalCache(cleanVideos);
    notifyListeners(cleanVideos);

    try {
      const res = await fetch('/api/videos/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: cleanVideos })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.videos)) {
          memoryVideos = data.videos;
          saveToLocalCache(data.videos);
          notifyListeners(data.videos);
          return data.videos;
        }
      }
    } catch (e) {
      console.error("Error saving all videos to server:", e);
    }

    return cleanVideos;
  }
};
