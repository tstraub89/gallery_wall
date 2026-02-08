import { initDB, ANALYSIS_STORE } from '../utils/imageStore';

// --- Analysis Caching ---

export async function savePhotoAnalysis(id: string, analysis: any): Promise<void> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ANALYSIS_STORE], 'readwrite');
        const store = transaction.objectStore(ANALYSIS_STORE);
        const request = store.put({ id, ...analysis });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function getPhotoAnalysis(id: string): Promise<any | null> {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ANALYSIS_STORE], 'readonly');
        const store = transaction.objectStore(ANALYSIS_STORE);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}
