import { useState, useEffect } from 'react';
import { getImage, getPreloadedUrl } from '../utils/imageStore';

interface ImageState {
    url: string | null;
    status: 'loading' | 'loaded' | 'not-found' | 'error';
}

/**
 * Hook to load an image from IndexedDB.
 * Checks preload cache first for instant display.
 */
export const useImage = (imageId: string | null, type: 'full' | 'thumb' = 'full', enabled = true): ImageState => {
    const [state, setState] = useState<ImageState>(() => {
        // Check preload cache immediately for sync initialization
        if (imageId && enabled) {
            const cached = getPreloadedUrl(imageId);
            if (cached) return { url: cached, status: 'loaded' };
        }
        return { url: null, status: 'loading' };
    });

    useEffect(() => {
        if (!enabled) return;
        let active = true;
        let objectUrl: string | null = null;

        const load = async () => {
            if (!imageId) {
                setState({ url: null, status: 'loaded' }); // Treat missing as loaded (null)
                return;
            }

            // Check preload cache first
            const cached = getPreloadedUrl(imageId);
            if (cached) {
                setState({ url: cached, status: 'loaded' });
                return;
            }

            setState({ url: null, status: 'loading' });

            try {
                const blob = await getImage(imageId, type);
                if (!active) return;

                if (blob) {
                    objectUrl = URL.createObjectURL(blob);
                    setState({ url: objectUrl, status: 'loaded' });
                } else {
                    setState({ url: null, status: 'not-found' });
                }
            } catch (err) {
                console.error("Failed to load image", imageId, err);
                if (active) {
                    setState({ url: null, status: 'error' });
                }
            }
        };

        load();

        return () => {
            active = false;
            // Don't revoke preloaded URLs - they're managed by the cache
            if (objectUrl && !getPreloadedUrl(imageId || '')) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imageId, type, enabled]);

    return state;
};

