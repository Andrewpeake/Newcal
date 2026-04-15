import type { CalendarStateRepository } from './calendar-state-repository.js';

const DB_NAME = 'newcal';
const DB_VERSION = 1;
const STORE_NAME = 'calendarKv';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

/**
 * Persists string blobs under arbitrary keys (Zustand persist names) in IndexedDB.
 */
export function createIdbCalendarStateRepository(): CalendarStateRepository {
  return {
    async get(key: string): Promise<string | null> {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const r = store.get(key);
        r.onsuccess = () => {
          const v = r.result;
          resolve(typeof v === 'string' ? v : null);
        };
        r.onerror = () => reject(r.error ?? new Error('IndexedDB get failed'));
      });
    },
    async set(key: string, value: string): Promise<void> {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB put failed'));
      });
    },
    async remove(key: string): Promise<void> {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
      });
    },
  };
}
