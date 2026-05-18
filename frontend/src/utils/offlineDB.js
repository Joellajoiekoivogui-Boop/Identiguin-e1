'use client';

const DB_NAME = 'identiguinee-v2';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB non disponible'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('documents'))
        db.createObjectStore('documents', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('citoyen_cache'))
        db.createObjectStore('citoyen_cache', { keyPath: 'acte' });
      if (!db.objectStoreNames.contains('meta'))
        db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

// Sauvegarde le snapshot complet de la blockchain en local
export async function syncSnapshot(docs, syncedAt) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['documents', 'meta'], 'readwrite');
    const store = tx.objectStore('documents');
    store.clear();
    for (const doc of docs) store.put(doc);
    tx.objectStore('meta').put({ key: 'lastSync', value: syncedAt, total: docs.length });
    tx.oncomplete = () => resolve(docs.length);
    tx.onerror = () => reject(tx.error);
  });
}

// Récupère un document par ID (mode offline)
export async function getDocumentOffline(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction('documents', 'readonly').objectStore('documents').get(id.toUpperCase());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

// Métadonnées du dernier sync (date + total)
export async function getSnapshotMeta() {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const req = db.transaction('meta', 'readonly').objectStore('meta').get('lastSync');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

// Sauvegarde le résultat d'une recherche citoyen
export async function saveCitoyenCache(acte, data) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction('citoyen_cache', 'readwrite')
        .objectStore('citoyen_cache')
        .put({ acte: acte.toUpperCase(), data, savedAt: new Date().toISOString() });
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
  } catch { /* silent */ }
}

// Récupère le dernier résultat citoyen mis en cache
export async function getCitoyenCache(acte) {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const req = db.transaction('citoyen_cache', 'readonly')
        .objectStore('citoyen_cache').get(acte.toUpperCase());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}
