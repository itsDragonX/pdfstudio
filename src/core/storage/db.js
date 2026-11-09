import { openDB } from 'idb';

const DB_NAME = 'PDFStudioDB';
const DB_VERSION = 1;

/**
 * Initializes and returns the IndexedDB instance.
 */
export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for active document session (recovery on reload)
      if (!db.objectStoreNames.contains('active_session')) {
        db.createObjectStore('active_session');
      }

      // Store for recent files metadata & thumbnails (capped by LRU)
      if (!db.objectStoreNames.contains('recent_files')) {
        const recentStore = db.createObjectStore('recent_files', { keyPath: 'id' });
        recentStore.createIndex('timestamp', 'timestamp');
      }

      // Store for user presets and settings
      if (!db.objectStoreNames.contains('user_presets')) {
        db.createObjectStore('user_presets', { keyPath: 'id' });
      }
    }
  });
}

