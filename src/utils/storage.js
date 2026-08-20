export const STORAGE_KEY = "budget-planner-data";
// Legacy: hier lag der Cache-Schlüssel bis er nach IndexedDB umgezogen ist.
// Wird nur noch zum Aufräumen alter Sessions verwendet.
export const LS_SESSION_KEY = "budget-planner-enc-key";

const DB_NAME = "budget-planner-keys";
const STORE_NAME = "keys";
const CACHE_KEY_ID = "cache-key";

const openKeyDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const withStore = async (mode, run) => {
  const db = await openKeyDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const req = run(tx.objectStore(STORE_NAME));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
};

// Der Schlüssel wird als non-extractable CryptoKey in IndexedDB abgelegt: er
// überlebt damit den Neustart der App (der Cache in localStorage tut das auch),
// lässt sich aber per JavaScript nicht auslesen. Vorher lag er in
// sessionStorage — dadurch war der Offline-Cache nach jedem Neustart
// unentschlüsselbar, also genau dann wertlos, wenn er gebraucht wurde.
let keyPromise = null;

const loadOrCreateKey = async () => {
  const existing = await withStore("readonly", (store) => store.get(CACHE_KEY_ID));
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  await withStore("readwrite", (store) => store.put(key, CACHE_KEY_ID));
  return key;
};

const getCacheKey = () => {
  if (!keyPromise) {
    keyPromise = loadOrCreateKey().catch((err) => { keyPromise = null; throw err; });
  }
  return keyPromise;
};

// Löscht das Schlüsselmaterial (Logout auf geteilten Geräten).
export const clearCacheKey = async () => {
  keyPromise = null;
  try { await withStore("readwrite", (store) => store.delete(CACHE_KEY_ID)); } catch { /* IndexedDB gesperrt */ }
  try { sessionStorage.removeItem(LS_SESSION_KEY); } catch { /* Storage gesperrt */ }
};

// Blockweise kodieren: `String.fromCharCode(...bytes)` wirft ab etwa 100k
// Argumenten einen RangeError und ließ den Cache ab ~1000 Einträgen still ausfallen.
const toBase64 = (bytes) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

export const encryptLS = async (plaintext) => {
  const key = await getCacheKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return toBase64(combined);
};

export const decryptLS = async (ciphertext) => {
  try {
    const key = await getCacheKey();
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch { return null; }
};
