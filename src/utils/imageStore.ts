const DB_NAME = 'GalleryPlannerDB';
const STORE_NAME = 'images';
const PROJECTS_STORE = 'projects';
const THUMB_STORE = 'thumbnails';
const DB_VERSION = 3;

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
            canvas.toBlob((thumbBlob) => resolve(thumbBlob || blob), 'image/jpeg', 0.8);
        };
        img.src = url;
    });
};

export const saveImage = async (id: string, blob: Blob): Promise<ImageMetadata & { id: string }> => {
    const db = await initDB();

    // Parallelize metadata calc and thumb generation
    const [metadata, thumbBlob] = await Promise.all([
        getImageDimensions(blob).catch(() => ({ width: 0, height: 0, aspectRatio: 1 })),
        generateThumbnail(blob)
    ]);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME, THUMB_STORE], 'readwrite');
        const imageStore = transaction.objectStore(STORE_NAME);
        const thumbStore = transaction.objectStore(THUMB_STORE);

        const name = (blob as File).name || 'Untitled';

        imageStore.put({ id, blob, name, ...metadata });
        // Store thumbnail
        thumbStore.put({ id, blob: thumbBlob });

        transaction.oncomplete = () => resolve({ id, name, ...metadata });
        transaction.onerror = () => reject('Error saving image');
    });
};

export const getImage = async (id: string, type: 'full' | 'thumb' = 'full'): Promise<Blob | null> => {
    const db = await initDB();
    const storeName = type === 'thumb' ? THUMB_STORE : STORE_NAME;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result ? request.result.blob : null);
        request.onerror = () => reject('Error fetching image');
    });
};

// Preload cache for warm-starting images
const preloadCache = new Map<string, string>();

export const getPreloadedUrl = (id: string): string | null => {
    return preloadCache.get(id) || null;
};

export const clearImageCache = () => {
    preloadCache.forEach((url) => {
        URL.revokeObjectURL(url);
    });
    preloadCache.clear();
    console.log("Image cache cleared.");
};

export const preloadImages = async (ids: string[], type: 'full' | 'thumb' = 'full'): Promise<void> => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    await Promise.all(uniqueIds.map(async (id) => {
        if (preloadCache.has(id)) return; // Already preloaded
        try {
            const blob = await getImage(id, type);
            if (blob) {
                const url = URL.createObjectURL(blob);
                preloadCache.set(id, url);
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
        const transaction = db.transaction([STORE_NAME, THUMB_STORE], 'readwrite');
        transaction.objectStore(STORE_NAME).delete(id);
        transaction.objectStore(THUMB_STORE).delete(id);

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

