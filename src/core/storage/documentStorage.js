import { getDB } from './db';

const MAX_RECENTS = 10;

/**
 * Save active document session for state persistence.
 */
export async function saveActiveSession({ name, size, bytes, pageCount }) {
  try {
    const db = await getDB();
    await db.put('active_session', {
      name,
      size,
      bytes,
      pageCount,
      timestamp: Date.now()
    }, 'current');
  } catch (err) {
    console.warn('Failed to save active session to IndexedDB:', err);
  }
}

/**
 * Retrieve active document session.
 */
export async function loadActiveSession() {
  try {
    const db = await getDB();
    return await db.get('active_session', 'current');
  } catch (err) {
    console.warn('Failed to load active session from IndexedDB:', err);
    return null;
  }
}

/**
 * Clear the active session.
 */
export async function clearActiveSession() {
  try {
    const db = await getDB();
    await db.delete('active_session', 'current');
  } catch (err) {
    console.warn('Failed to clear active session:', err);
  }
}

/**
 * Add or update recent file metadata with LRU eviction.
 */
export async function addRecentFile({ name, size, pageCount, thumbnail }) {
  try {
    const db = await getDB();
    const id = `${name}_${size}`;
    await db.put('recent_files', {
      id,
      name,
      size,
      pageCount,
      thumbnail,
      timestamp: Date.now()
    });

    // Enforce LRU cap
    const tx = db.transaction('recent_files', 'readwrite');
    const store = tx.store;
    const index = store.index('timestamp');
    let allKeys = await index.getAllKeys();
    if (allKeys.length > MAX_RECENTS) {
      const keysToDelete = allKeys.slice(0, allKeys.length - MAX_RECENTS);
      for (const k of keysToDelete) {
        await store.delete(k);
      }
    }
    await tx.done;
  } catch (err) {
    console.warn('Failed to update recent files:', err);
  }
}

/**
 * Get all recent file entries ordered by most recent first.
 */
export async function getRecentFiles() {
  try {
    const db = await getDB();
    const list = await db.getAllFromIndex('recent_files', 'timestamp');
    return list.reverse();
  } catch (err) {
    console.warn('Failed to get recent files:', err);
    return [];
  }
}

/**
 * Query browser storage quota usage.
 */
export async function getStorageEstimate() {
  if (navigator?.storage?.estimate) {
    return await navigator.storage.estimate();
  }
  return { usage: 0, quota: 0 };
}

