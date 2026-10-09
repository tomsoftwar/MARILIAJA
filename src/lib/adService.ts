export interface PortalAdsConfig {
  homeTop?: string;
  homeGrid?: string;
  homeBottom?: string;
}

const STORAGE_KEY = 'mj_portal_ads_config';

const DEFAULT_ADS: PortalAdsConfig = {
  homeTop: '',
  homeGrid: '',
  homeBottom: ''
};

let memoryAds: PortalAdsConfig = { ...DEFAULT_ADS };
type AdListener = (ads: PortalAdsConfig) => void;
const listeners: Set<AdListener> = new Set();

function loadFromLocal(): PortalAdsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_ADS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn("Failed to read ads config from localStorage:", e);
  }
  return DEFAULT_ADS;
}

function saveToLocal(ads: PortalAdsConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  } catch (e) {
    console.warn("Failed to write ads config to localStorage:", e);
  }
}

async function syncWithServer(): Promise<PortalAdsConfig> {
  try {
    const res = await fetch('/api/ads');
    if (res.ok) {
      const serverAds = await res.json();
      if (serverAds && typeof serverAds === 'object') {
        memoryAds = { ...memoryAds, ...serverAds };
        saveToLocal(memoryAds);
        notifyListeners(memoryAds);
        return memoryAds;
      }
    }
  } catch (err) {
    // quiet
  }

  // Fallback for static hosting like GitHub Pages
  try {
    const staticRes = await fetch('./data/ads.json');
    if (staticRes.ok) {
      const staticAds = await staticRes.json();
      if (staticAds && typeof staticAds === 'object') {
        memoryAds = { ...memoryAds, ...staticAds };
        saveToLocal(memoryAds);
        notifyListeners(memoryAds);
        return memoryAds;
      }
    }
  } catch (e) {
    // quiet
  }

  return memoryAds;
}

function notifyListeners(ads: PortalAdsConfig) {
  listeners.forEach(fn => {
    try {
      fn(ads);
    } catch (e) {
      console.error("Error in ads listener:", e);
    }
  });
}

if (typeof window !== 'undefined') {
  memoryAds = loadFromLocal();
  syncWithServer();

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncWithServer();
    }
  });
}

export const adService = {
  getAds(): PortalAdsConfig {
    return memoryAds;
  },

  subscribe(callback: AdListener): () => void {
    listeners.add(callback);
    callback(memoryAds);
    return () => {
      listeners.delete(callback);
    };
  },

  saveAds(newAds: PortalAdsConfig): PortalAdsConfig {
    memoryAds = { ...memoryAds, ...newAds };
    saveToLocal(memoryAds);
    notifyListeners(memoryAds);

    fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memoryAds)
    }).catch(e => console.error("Error saving ads to server:", e));

    return memoryAds;
  }
};
