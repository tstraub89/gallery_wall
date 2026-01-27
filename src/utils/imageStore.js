const DB_NAME = 'GalleryPlannerDB';
const STORE_NAME = 'images';
const DB_VERSION = 1;

export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject('IndexedDB error');

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
    });
};

// Helper: Extract dimensions from Blob
const getImageDimensions = (blob) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height, aspectRatio: img.width / img.height });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject('Invalid image');
        };
        img.src = url;
    });
};

export const saveImage = async (id, blob) => {
    const db = await initDB();

    // Calculate dimensions before saving
    let metadata = { width: 0, height: 0, aspectRatio: 1 };
    try {
        metadata = await getImageDimensions(blob);
    } catch {
        console.warn("Could not calculate dimensions for image", id);
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Extract name if available (it might be a Blob with no name if generated, but File usually has it)
        const name = blob.name || 'Untitled';

        const request = store.put({ id, blob, name, ...metadata });

        request.onsuccess = () => resolve({ id, name, ...metadata });
        request.onerror = () => reject('Error saving image');
    });
};

export const getImage = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result ? request.result.blob : null);
        request.onerror = () => reject('Error fetching image');
    });
};

export const getImageMetadata = async (ids = null) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll(); // Get all records

        request.onsuccess = () => {
            const all = request.result || [];
            // Map to metadata only (exclude blob for perf if needed, but IDB retrieval gets whole obj)
            // If ids filter provided, use it
            const filtered = ids
                ? all.filter(item => ids.includes(item.id))
                : all;

            const metadataMap = {};
            filtered.forEach(item => {
                metadataMap[item.id] = {
                    width: item.width,
                    height: item.height,
                    aspectRatio: item.aspectRatio,
                    name: item.name // Include name
                };
            });
            resolve(metadataMap);
        };
        request.onerror = () => reject('Error fetching metadata');
    });
};

export const migrateLegacyImages = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async () => {
            const allImages = request.result;
            let updatedCount = 0;

            for (const item of allImages) {
                if (!item.width || !item.height) {
                    try {
                        const dims = await getImageDimensions(item.blob);
                        // Update record in separate transaction to avoid timeouts? 
                        // Actually we can reuse if small, but let's do one-by-one or batch if needed.
                        // For simplicity in this helper, we'll assume the transaction is still alive or start new ones.
                        // Wait, 'await' inside onsuccess callback with same transaction might be tricky if it commits.
                        // Better structure: gather IDs effectively, then process.
                        // NOTE: Transaction might autoclose if we await.

                        // Let's restart transaction for updates.
                        const updateTx = db.transaction([STORE_NAME], 'readwrite');
                        const updateStore = updateTx.objectStore(STORE_NAME);
                        updateStore.put({ ...item, ...dims });
                        updatedCount++;
                    } catch (err) {
                        console.error("Migration failed for", item.id, err);
                    }
                }
            }
            resolve(updatedCount);
        };
        request.onerror = () => reject('Error scanning DB');
    });
};

export const deleteImage = async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error deleting image');
    });
};
