import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_FILE = path.join(process.cwd(), 'public', 'data', 'news.json');
const VIDEOS_FILE = path.join(process.cwd(), 'public', 'data', 'videos.json');
const ADS_FILE = path.join(process.cwd(), 'public', 'data', 'ads.json');
const MESSAGES_FILE = path.join(process.cwd(), 'public', 'data', 'messages.json');
const AUTH_FILE = path.join(process.cwd(), 'public', 'data', 'auth.json');
const DELETED_NEWS_FILE = path.join(process.cwd(), 'public', 'data', 'deleted_news.json');
const DELETED_VIDEOS_FILE = path.join(process.cwd(), 'public', 'data', 'deleted_videos.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readDeletedNewsIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_NEWS_FILE)) {
      const data = fs.readFileSync(DELETED_NEWS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (err) {}
  return new Set();
}

function addDeletedNewsId(id: string) {
  try {
    const set = readDeletedNewsIds();
    set.add(id);
    ensureDir(DELETED_NEWS_FILE);
    fs.writeFileSync(DELETED_NEWS_FILE, JSON.stringify(Array.from(set), null, 2), 'utf-8');
  } catch (err) {}
}

function readDeletedVideoIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_VIDEOS_FILE)) {
      const data = fs.readFileSync(DELETED_VIDEOS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch (err) {}
  return new Set();
}

function addDeletedVideoId(id: string) {
  try {
    const set = readDeletedVideoIds();
    set.add(id);
    ensureDir(DELETED_VIDEOS_FILE);
    fs.writeFileSync(DELETED_VIDEOS_FILE, JSON.stringify(Array.from(set), null, 2), 'utf-8');
  } catch (err) {}
}

function readMessagesList(): any[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error reading messages file:", err);
  }
  return [];
}

function writeMessagesList(messages: any[]) {
  try {
    ensureDir(MESSAGES_FILE);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
    const distMessages = path.join(process.cwd(), 'dist', 'data', 'messages.json');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      ensureDir(distMessages);
      fs.writeFileSync(distMessages, JSON.stringify(messages, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error("Error saving messages to disk:", err);
  }
}

function readAdsConfig(): any {
  try {
    if (fs.existsSync(ADS_FILE)) {
      const data = fs.readFileSync(ADS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading ads file:", err);
  }
  return {};
}

function writeAdsConfig(ads: any) {
  try {
    ensureDir(ADS_FILE);
    fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), 'utf-8');

    const distAds = path.join(process.cwd(), 'dist', 'data', 'ads.json');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      ensureDir(distAds);
      fs.writeFileSync(distAds, JSON.stringify(ads, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error("Error saving ads to disk:", err);
  }
}

function readVideosList(): any[] {
  try {
    if (fs.existsSync(VIDEOS_FILE)) {
      const data = fs.readFileSync(VIDEOS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const deleted = readDeletedVideoIds();
        return parsed.filter(v => v && v.id && !deleted.has(v.id));
      }
    }
  } catch (err) {
    console.error("Error reading videos file:", err);
  }
  return [];
}

function writeVideosList(videosList: any[]) {
  try {
    ensureDir(VIDEOS_FILE);
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videosList, null, 2), 'utf-8');

    const distVideosFile = path.join(process.cwd(), 'dist', 'data', 'videos.json');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      ensureDir(distVideosFile);
      fs.writeFileSync(distVideosFile, JSON.stringify(videosList, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error("Error saving videos to disk:", err);
  }
}

function readNewsList(): any[] {
  try {
    if (fs.existsSync(NEWS_FILE)) {
      const data = fs.readFileSync(NEWS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const deleted = readDeletedNewsIds();
        return parsed.filter(n => n && n.id && !deleted.has(n.id));
      }
    }
  } catch (err) {
    console.error("Error reading news file:", err);
  }
  return [];
}

function writeNewsList(newsList: any[]) {
  try {
    ensureDir(NEWS_FILE);
    fs.writeFileSync(NEWS_FILE, JSON.stringify(newsList, null, 2), 'utf-8');

    // Also write to dist/data/news.json if dist directory exists
    const distNewsFile = path.join(process.cwd(), 'dist', 'data', 'news.json');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      ensureDir(distNewsFile);
      fs.writeFileSync(distNewsFile, JSON.stringify(newsList, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error("Error saving news to disk:", err);
  }
}

function readAuthSettings() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading auth file:", err);
  }
  return null;
}

function writeAuthSettings(settings: any) {
  try {
    ensureDir(AUTH_FILE);
    fs.writeFileSync(AUTH_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving auth settings to disk:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS for multi-device access (Mobile, Desktop, Previews)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  // API health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", newsCount: readNewsList().length });
  });

  // GET /api/news - returns current shared news for all devices
  app.get("/api/news", (req, res) => {
    const list = readNewsList();
    res.json(list);
  });

  // POST /api/news - save or update an article shared across all devices
  app.post("/api/news", (req, res) => {
    const article = req.body;
    if (!article || !article.title) {
      return res.status(400).json({ error: "Título da notícia é obrigatório" });
    }

    const currentList = readNewsList();
    const existingIndex = currentList.findIndex(n => n.id === article.id);

    if (existingIndex >= 0) {
      currentList[existingIndex] = { 
        ...currentList[existingIndex], 
        ...article, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      currentList.unshift({
        ...article,
        id: article.id || `mj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        createdAt: article.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    writeNewsList(currentList);
    res.json({ success: true, count: currentList.length, news: currentList });
  });

  // POST /api/news/sync - batch sync news from any device, strictly ignoring deleted articles
  app.post("/api/news/sync", (req, res) => {
    const incomingNews = req.body.news;
    if (!Array.isArray(incomingNews)) {
      return res.status(400).json({ error: "Campo 'news' deve ser uma lista de notícias" });
    }

    const deletedIds = readDeletedNewsIds();
    const currentList = readNewsList();
    const map = new Map<string, any>();

    // Add current non-deleted news
    currentList.forEach(item => {
      if (item && item.id && !deletedIds.has(item.id)) {
        map.set(item.id, item);
      }
    });

    // Merge or add incoming news, strictly rejecting deleted IDs
    incomingNews.forEach(item => {
      if (item && item.id && !deletedIds.has(item.id)) {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        } else {
          const existing = map.get(item.id);
          const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          const incomingTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          if (incomingTime >= existingTime) {
            map.set(item.id, { ...existing, ...item });
          }
        }
      }
    });

    const merged = Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    writeNewsList(merged);
    res.json({ success: true, count: merged.length, news: merged });
  });

  // DELETE /api/news/:id - permanently removes article and adds to deleted tombstones
  app.delete("/api/news/:id", (req, res) => {
    const { id } = req.params;
    addDeletedNewsId(id);
    const currentList = readNewsList();
    const filtered = currentList.filter(n => n.id !== id);
    writeNewsList(filtered);
    res.json({ success: true, count: filtered.length, news: filtered });
  });

  // POST /api/news/replace - authoritatively replaces all news on server (used after deletes or saves)
  app.post("/api/news/replace", (req, res) => {
    const incomingNews = req.body.news;
    if (!Array.isArray(incomingNews)) {
      return res.status(400).json({ error: "Campo 'news' deve ser uma lista de notícias" });
    }

    const currentList = readNewsList();
    const incomingIds = new Set(incomingNews.map(n => n.id));
    currentList.forEach(n => {
      if (n && n.id && !incomingIds.has(n.id)) {
        addDeletedNewsId(n.id);
      }
    });

    const deletedIds = readDeletedNewsIds();
    const filtered = incomingNews.filter(n => n && n.id && !deletedIds.has(n.id));
    writeNewsList(filtered);
    res.json({ success: true, count: filtered.length, news: filtered });
  });

  // GET /api/videos - returns YouTube videos for TV Marília Já
  app.get("/api/videos", (req, res) => {
    const list = readVideosList();
    res.json(list);
  });

  // POST /api/videos - save or update a YouTube video
  app.post("/api/videos", (req, res) => {
    const video = req.body;
    if (!video || !video.title || !video.youtubeId) {
      return res.status(400).json({ error: "Título e ID/Link do YouTube são obrigatórios" });
    }

    const currentList = readVideosList();
    const existingIndex = currentList.findIndex(v => v.id === video.id);

    if (existingIndex >= 0) {
      currentList[existingIndex] = {
        ...currentList[existingIndex],
        ...video
      };
    } else {
      currentList.unshift({
        ...video,
        id: video.id || `video-${Date.now()}`,
        publishedAt: video.publishedAt || new Date().toISOString()
      });
    }

    writeVideosList(currentList);
    res.json({ success: true, count: currentList.length, videos: currentList });
  });

  // POST /api/videos/sync - batch sync videos, strictly ignoring deleted ones
  app.post("/api/videos/sync", (req, res) => {
    const incomingVideos = req.body.videos;
    if (!Array.isArray(incomingVideos)) {
      return res.status(400).json({ error: "Campo 'videos' deve ser uma lista" });
    }

    const deletedIds = readDeletedVideoIds();
    const currentList = readVideosList();
    const map = new Map<string, any>();
    currentList.forEach(v => {
      if (v && v.id && !deletedIds.has(v.id)) {
        map.set(v.id, v);
      }
    });
    incomingVideos.forEach(v => {
      if (v && v.id && !deletedIds.has(v.id)) {
        map.set(v.id, { ...(map.get(v.id) || {}), ...v });
      }
    });

    const merged = Array.from(map.values());
    writeVideosList(merged);
    res.json({ success: true, count: merged.length, videos: merged });
  });

  // DELETE /api/videos/:id - permanently removes video and records tombstone
  app.delete("/api/videos/:id", (req, res) => {
    const { id } = req.params;
    addDeletedVideoId(id);
    const currentList = readVideosList();
    const filtered = currentList.filter(v => v.id !== id);
    writeVideosList(filtered);
    res.json({ success: true, count: filtered.length, videos: filtered });
  });

  // POST /api/videos/replace - authoritatively replaces all videos on server (used after deletes and saves)
  app.post("/api/videos/replace", (req, res) => {
    const incomingVideos = req.body.videos;
    if (!Array.isArray(incomingVideos)) {
      return res.status(400).json({ error: "Campo 'videos' deve ser uma lista" });
    }

    const currentList = readVideosList();
    const incomingIds = new Set(incomingVideos.map(v => v.id));
    currentList.forEach(v => {
      if (v && v.id && !incomingIds.has(v.id)) {
        addDeletedVideoId(v.id);
      }
    });

    const deletedIds = readDeletedVideoIds();
    const filtered = incomingVideos.filter(v => v && v.id && !deletedIds.has(v.id));
    writeVideosList(filtered);
    res.json({ success: true, count: filtered.length, videos: filtered });
  });

  // GET /api/auth/settings
  app.get("/api/auth/settings", (req, res) => {
    const settings = readAuthSettings();
    res.json(settings || {});
  });

  // POST /api/auth/settings
  app.post("/api/auth/settings", (req, res) => {
    const settings = req.body;
    if (settings) {
      writeAuthSettings(settings);
    }
    res.json({ success: true });
  });

  // GET /api/ads
  app.get("/api/ads", (req, res) => {
    const ads = readAdsConfig();
    res.json(ads || {});
  });

  // POST /api/ads
  app.post("/api/ads", (req, res) => {
    const ads = req.body;
    if (ads && typeof ads === 'object') {
      writeAdsConfig(ads);
    }
    res.json({ success: true, ads });
  });

  // POST /api/contact - receive and store contact messages destined for portalmariliaja@gmail.com
  app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Nome, e-mail e mensagem são obrigatórios." });
    }

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      email,
      subject: subject || 'Contato pelo Portal MaríliaJá',
      message,
      forwardTo: 'portalmariliaja@gmail.com',
      createdAt: new Date().toISOString()
    };

    try {
      const messages = readMessagesList();
      messages.unshift(newMessage);
      writeMessagesList(messages);
    } catch (e) {
      console.error("Error saving contact message:", e);
    }

    res.json({ 
      success: true, 
      message: "Mensagem recebida e encaminhada para portalmariliaja@gmail.com",
      data: newMessage
    });
  });

  // GET /api/contact
  app.get("/api/contact", (req, res) => {
    res.json(readMessagesList());
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
