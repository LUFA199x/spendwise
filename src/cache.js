const PREFIX = "sw:";

export const cache = {
  get(key) {
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(key, value) {
    try { sessionStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
  },
  del(key) {
    try { sessionStorage.removeItem(PREFIX + key); } catch {}
  },
  clear() {
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => sessionStorage.removeItem(k));
    } catch {}
  },
};
