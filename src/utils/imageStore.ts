const DB_NAME = 'GalleryPlannerDB';
const STORE_NAME = 'images';
const PROJECTS_STORE = 'projects';
const THUMB_STORE = 'thumbnails';
const PREVIEW_STORE = 'previews';
const DB_VERSION = 4;

export interface ImageMetadata {
    width: number;
    height: number;
    aspectRatio: number;
    name?: string;
}

interface StoredImage extends ImageMetadata {
    id: string;
    blob: Blob;
}

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject('IndexedDB error');

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(THUMB_STORE)) {
                db.createObjectStore(THUMB_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(PREVIEW_STORE)) {
                db.createObjectStore(PREVIEW_STORE, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
    });
};

// Helper: Extract dimensions from Blob
const getImageDimensions = (blob: Blob): Promise<ImageMetadata> => {
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

// Helper: Generate Thumbnail
const generateThumbnail = (blob: Blob, maxWidth = 800, maxHeight = 800): Promise<Blob> => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Should not happen, but fallback
                resolve(blob);
                return;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((thumbBlob) => resolve(thumbBlob || blob), 'image/webp', 0.75);
        };
        img.src = url;
    });
};


// Helper: Resize and Optimize Image
// target: 'master' (WebP 0.92, 5000px max) | 'preview' (WebP 0.82, 1600px max)
const processImage = async (blob: Blob, target: 'master' | 'preview' = 'master'): Promise<Blob> => {
    const MAX_DIM = target === 'master' ? 5000 : 1600;
    const QUALITY = target === 'master' ? 0.92 : 0.82;

    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);

            // Calculate new dimensions
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_DIM) {
                    height *= MAX_DIM / width;
                    width = MAX_DIM;
                }
            } else {
                if (height > MAX_DIM) {
                    width *= MAX_DIM / height;
                    height = MAX_DIM;
                }
            }

            // Skip optimization if it's already a small enough WebP and we're targeting master
            if (target === 'master' && blob.type === 'image/webp' && img.width <= MAX_DIM && img.height <= MAX_DIM) {
                resolve(blob);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(blob); return; }

            // Ensure smooth scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // White background for transparency
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((newBlob) => {
                if (newBlob) {
                    console.log(`[${target.toUpperCase()}] Processed: ${Math.round(blob.size / 1024)}KB -> ${Math.round(newBlob.size / 1024)}KB (${width}x${height})`);
                    resolve(newBlob);
                } else {
                    resolve(blob);
                }
            }, 'image/webp', QUALITY);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(blob);
        };
        img.src = url;
    });
};

export const saveImage = async (
    id: string,
    blob: Blob,
    options: { skipOptimization?: boolean } = {}
): Promise<ImageMetadata & { id: string }> => {
    const db = await initDB();

    // Balanced Pro Strategy:
    // 1. Master: High-quality WebP (0.92), capped at 5000px
    // 2. Preview: Medium-quality WebP (0.82), capped at 1600px
    // 3. Thumb: Low-quality JPEG (0.8), capped at 800px (existing logic)

    console.log(`Processing image save for ${id}...`);

    const [masterBlob, previewBlob] = await Promise.all([
        options.skipOptimization ? blob : processImage(blob, 'master'),
        processImage(blob, 'preview')
    ]);

    const [metadata, thumbBlob] = await Promise.all([
        getImageDimensions(masterBlob).catch(() => ({ width: 0, height: 0, aspectRatio: 1 })),
        generateThumbnail(masterBlob)
    ]);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME, THUMB_STORE, PREVIEW_STORE], 'readwrite');
        const imageStore = transaction.objectStore(STORE_NAME);
        const thumbStore = transaction.objectStore(THUMB_STORE);
        const previewStore = transaction.objectStore(PREVIEW_STORE);

        const name = (blob as File).name || 'Untitled';

        imageStore.put({ id, blob: masterBlob, name, ...metadata });
        previewStore.put({ id, blob: previewBlob });
        thumbStore.put({ id, blob: thumbBlob });

        transaction.oncomplete = () => resolve({ id, name, ...metadata });
        transaction.onerror = () => reject('Error saving image with dual-blob strategy');
    });
};

export const getImage = async (id: string, type: 'full' | 'preview' | 'thumb' = 'full'): Promise<Blob | null> => {
    const db = await initDB();
    let storeName = STORE_NAME;
    if (type === 'thumb') storeName = THUMB_STORE;
    if (type === 'preview') storeName = PREVIEW_STORE;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result ? request.result.blob : null);
        request.onerror = () => reject('Error fetching image');
    });
};

// LRU Cache for warm-starting images
const CACHE_CAPACITY = 100; // Keep last 50 images
const preloadCache = new Map<string, string>(); // Order is preserved in JS Map (insertion order)

const getCacheKey = (id: string, type: string) => `${id}:${type}`;

export const getPreloadedUrl = (id: string, type: 'full' | 'preview' | 'thumb' = 'full'): string | null => {
    const key = getCacheKey(id, type);
    const url = preloadCache.get(key);
    if (url) {
        // LRU: Move to end (most recently used)
        preloadCache.delete(key);
        preloadCache.set(key, url);
        return url;
    }
    return null;
};

export const cacheUrl = (id: string, type: 'full' | 'preview' | 'thumb', url: string) => {
    const key = getCacheKey(id, type);
    if (preloadCache.has(key)) {
        // Just refresh position
        preloadCache.delete(key);
        preloadCache.set(key, url);
    } else {
        // Add new
        if (preloadCache.size >= CACHE_CAPACITY) {
            // Evict oldest (first)
            const firstKey = preloadCache.keys().next().value;
            if (firstKey) {
                const oldUrl = preloadCache.get(firstKey);
                if (oldUrl) URL.revokeObjectURL(oldUrl);
                preloadCache.delete(firstKey);
            }
        }
        preloadCache.set(key, url);
    }
};

export const clearImageCache = () => {
    preloadCache.forEach((url) => {
        URL.revokeObjectURL(url);
    });
    preloadCache.clear();
    console.log("Image cache cleared.");
};

export const preloadImages = async (ids: string[], type: 'full' | 'preview' | 'thumb' = 'full'): Promise<void> => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    await Promise.all(uniqueIds.map(async (id) => {
        const key = getCacheKey(id, type);
        if (preloadCache.has(key)) return; // Already preloaded

        try {
            const blob = await getImage(id, type);
            if (blob) {
                const url = URL.createObjectURL(blob);
                cacheUrl(id, type, url);
            }
        } catch (err) {
            console.warn('Failed to preload image:', id, err);
        }
    }));
};

export const getImageMetadata = async (ids: string[] | null = null): Promise<Record<string, ImageMetadata>> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        // Optimization: For large libraries, using a cursor is faster than getAll() 
        // if we only need metadata and want to avoid massive memory allocation for blobs
        const metadataMap: Record<string, ImageMetadata> = {};

        if (ids && ids.length < 50) {
            // If few specific IDs, just get them
            let count = 0;
            if (ids.length === 0) return resolve({});

            ids.forEach(id => {
                const req = store.get(id);
                req.onsuccess = () => {
                    if (req.result) {
                        const { width, height, aspectRatio, name } = req.result;
                        metadataMap[id] = { width, height, aspectRatio, name };
                    }
                    count++;
                    if (count === ids.length) resolve(metadataMap);
                };
            });
        } else {
            // Scan all (or many)
            const request = store.openCursor();
            request.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                    const item = cursor.value as StoredImage;
                    if (!ids || ids.includes(item.id)) {
                        metadataMap[item.id] = {
                            width: item.width,
                            height: item.height,
                            aspectRatio: item.aspectRatio,
                            name: item.name
                        };
                    }
                    cursor.continue();
                } else {
                    resolve(metadataMap);
                }
            };
        }
        transaction.onerror = () => reject('Error fetching metadata');
    });
};

export const migrateLegacyImages = async () => {
    const db = await initDB();
    console.log("Starting image migration check...");

    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME, THUMB_STORE], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        const request = store.openCursor();
        let migrationQueue: StoredImage[] = [];

        request.onsuccess = (event: Event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const item = cursor.value as StoredImage;

                // We check thumbnails in parallel by adding ID to a list and checking later
                // or we can do it here if we use a different approach.
                // Actually, let's just collect all images that might need help.
                migrationQueue.push(item);

                cursor.continue();
            } else {
                // Done scanning, now process queue
                processMigrationQueue(db, migrationQueue).then(resolve);
            }
        };
        request.onerror = () => {
            console.error("Migration scan failed");
            resolve(0);
        };
    });
};

const processMigrationQueue = async (db: IDBDatabase, queue: StoredImage[]): Promise<number> => {
    let updatedCount = 0;
    console.log(`Checking ${queue.length} images for migration...`);

    for (const item of queue) {
        let needsDims = !item.width || !item.height;
        let needsThumb = false;

        // Check if thumbnail exists
        try {
            const thumb = await new Promise((resolve, reject) => {
                const tx = db.transaction([THUMB_STORE], 'readonly');
                const req = tx.objectStore(THUMB_STORE).get(item.id);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject();
            });
            if (!thumb) needsThumb = true;
        } catch {
            needsThumb = true;
        }

        if (needsDims || needsThumb) {
            try {
                const updates = {};
                if (needsDims) {
                    const dims = await getImageDimensions(item.blob);
                    Object.assign(updates, dims);
                }

                const thumbBlob = await generateThumbnail(item.blob);

                const upTx = db.transaction([STORE_NAME, THUMB_STORE], 'readwrite');
                if (needsDims) {
                    upTx.objectStore(STORE_NAME).put({ ...item, ...updates });
                }
                upTx.objectStore(THUMB_STORE).put({ id: item.id, blob: thumbBlob });

                await new Promise((resolve) => {
                    upTx.oncomplete = resolve;
                    upTx.onerror = resolve; // Continue on error if one fails
                });

                updatedCount++;
            } catch (err) {
                console.error("Migration failed for image", item.id, err);
            }
        }
    }

    if (updatedCount > 0) console.log(`Migration finished: updated ${updatedCount} images.`);
    return updatedCount;
};

export const deleteImage = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME, THUMB_STORE, PREVIEW_STORE], 'readwrite');
        transaction.objectStore(STORE_NAME).delete(id);
        transaction.objectStore(THUMB_STORE).delete(id);
        transaction.objectStore(PREVIEW_STORE).delete(id);

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Error deleting image');
    });
};

// --- Project Persistence ---

export const saveProjectData = async (data: any): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);

        // We store the shell (metadata + frames)
        store.put({ id: 'current_session', ...data });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Error saving project data');
    });
};

export const loadProjectData = async (): Promise<any> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.get('current_session');

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject('Error loading project data');
    });
};

// --- Garbage Collection ---

export const cleanUpOrphanedImages = async (activeImageIds: string[]): Promise<number> => {
    await initDB(); // Ensure DB is open/ready
    // Get all stored image IDs. Passing null returns metadata for all.
    const allStoredImages = await getImageMetadata(null);
    const storedIds = Object.keys(allStoredImages);

    // Determine which IDs are NOT in the active set
    const orphans = storedIds.filter(id => !activeImageIds.includes(id));

    if (orphans.length === 0) return 0;

    console.log(`Found ${orphans.length} orphaned images. Cleaning up...`);

    let deletedCount = 0;
    // We can run deletion in parallel chunks or serial. Serial is safer for DB locks.
    for (const id of orphans) {
        try {
            await deleteImage(id);
            deletedCount++;
        } catch (err) {
            console.error(`Failed to delete orphan image ${id}`, err);
        }
    }

    return deletedCount;
};

