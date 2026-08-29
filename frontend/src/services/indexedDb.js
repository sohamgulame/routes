/**
 * AURA-NER Browser IndexedDB Offline Queue Service
 * Stores road hazard incident reports, GPS coordinates & base64 photos when in zero-network hill dead zones.
 */

const DB_NAME = 'aura_ner_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'incident_queue';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'clientOfflineId' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Save an incident to offline IndexedDB storage
 */
export async function saveOfflineIncident(incidentData) {
  const db = await openDatabase();
  const clientOfflineId = 'OFFLINE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  
  const record = {
    ...incidentData,
    clientOfflineId,
    queuedAt: new Date().toISOString(),
    syncStatus: 'PENDING_NETWORK',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Get all queued offline incidents
 */
export async function getQueuedIncidents() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Error reading IndexedDB offline queue:', err);
    return [];
  }
}

/**
 * Remove synced incidents from IndexedDB
 */
export async function removeSyncedIncidents(clientOfflineIds) {
  if (!clientOfflineIds || clientOfflineIds.length === 0) return;
  
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    clientOfflineIds.forEach((id) => {
      store.delete(id);
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Clear all offline records
 */
export async function clearAllOfflineIncidents() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}
