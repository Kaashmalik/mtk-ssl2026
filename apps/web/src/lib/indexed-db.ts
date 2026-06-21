import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SSLDatabase extends DBSchema {
  matches: {
    key: string;
    value: {
      id: string;
      data: unknown;
      updatedAt: number;
      syncStatus: 'synced' | 'pending';
    };
    indexes: { 'by-sync-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<SSLDatabase>> | null = null;

export function initDB() {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB<SSLDatabase>('ssl-database', 1, {
      upgrade(db) {
        const store = db.createObjectStore('matches', {
          keyPath: 'id',
        });
        store.createIndex('by-sync-status', 'syncStatus');
      },
    });
  }
  return dbPromise;
}

export async function saveMatchOffline(id: string, data: unknown) {
  const db = await initDB();
  if (!db) return;
  
  await db.put('matches', {
    id,
    data,
    updatedAt: Date.now(),
    syncStatus: 'pending',
  });
}

export async function getOfflineMatch(id: string) {
  const db = await initDB();
  if (!db) return null;
  return db.get('matches', id);
}

export async function getPendingMatches() {
  const db = await initDB();
  if (!db) return [];
  return db.getAllFromIndex('matches', 'by-sync-status', 'pending');
}

export async function markMatchSynced(id: string) {
  const db = await initDB();
  if (!db) return;
  const match = await db.get('matches', id);
  if (match) {
    match.syncStatus = 'synced';
    await db.put('matches', match);
  }
}
