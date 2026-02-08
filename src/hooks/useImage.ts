import { useState, useEffect } from 'react';
import { getImage, getPreloadedUrl, getImageMetadata, cacheUrl } from '../utils/imageStore';

interface ImageState {
    url: string | null;
    metadata: { width: number; height: number } | null;
    status: 'loading' | 'loaded' | 'not-found' | 'error';
}

/**
 * Hook to load an image from IndexedDB.
 * Checks preload cache first for instant display.
 */
export const useImage = (imageId: string | null, type: 'full' | 'preview' | 'thumb' = 'full', enabled = true): ImageState => {
    const [state, setState] = useState<ImageState>(() => {
        // Check preload cache immediately for sync initialization
        // We verify cache even if disabled to prevent flash if we already have it in memory
        if (imageId) {
            const cached = getPreloadedUrl(imageId, type);
            if (cached) return { url: cached, metadata: null, status: 'loaded' };
        }
        return { url: null, metadata: null, status: 'loading' };
    });

    useEffect(() => {
        if (!enabled) return;
        let active = true;
        let objectUrl: string | null = null;

        const load = async () => {
            if (!imageId) {
                setState({ url: null, metadata: null, status: 'loaded' }); // Treat missing as loaded (null)
                return;
            }

            // Check preload cache first
            const cached = getPreloadedUrl(imageId, type);
            if (cached) {
                // Even if cached, we need metadata for PPI warnings
                try {
                    const metaMap = await getImageMetadata([imageId]);
                    if (active) {
                        setState({ url: cached, metadata: metaMap[imageId] || null, status: 'loaded' });
                    }
                } catch (err) {
                    console.error("Failed to fetch metadata for cached image", err);
                    if (active) setState({ url: cached, metadata: null, status: 'loaded' });
                }
                return;
            }

            // Reset state or keep previous if transitioning tiers for the same image
            setState(prev => ({
                url: prev.url,
                metadata: prev.metadata,
                status: 'loading'
            }));

            try {
                // Fetch both Blob and Metadata (always Master metadata for PPI accuracy)
                const [blob, metaMap] = await Promise.all([
                    getImage(imageId, type),
                    getImageMetadata([imageId])
                ]);

                if (!active) return;

                const metadata = metaMap[imageId] || null;

                if (blob) {
                    objectUrl = URL.createObjectURL(blob);
                    cacheUrl(imageId, type, objectUrl); // Add to LRU Cache
                    setState({ url: objectUrl, metadata, status: 'loaded' });
                } else {
                    setState({ url: null, metadata: null, status: 'not-found' });
                }
            } catch (err) {
                console.error("Failed to load image", imageId, err);
                if (active) {
                    setState({ url: null, metadata: null, status: 'error' });
                }
            }
        };

        load();

        return () => {
            active = false;
            // Don't revoke preloaded URLs - they're managed by the cache
            if (objectUrl && !getPreloadedUrl(imageId || '', type)) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imageId, type, enabled]);

    return state;
};

