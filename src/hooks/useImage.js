import { useState, useEffect } from 'react';
import { getImage } from '../utils/imageStore';

/**
 * Hook to load an image from IndexedDB.
 * @param {string} imageId - The ID of the image to load
 * @returns {{ url: string|null, status: 'loading'|'loaded'|'not-found'|'error' }}
 */
export const useImage = (imageId) => {
    const [state, setState] = useState({ url: null, status: 'loading' });

    useEffect(() => {
        let active = true;
        let objectUrl = null;

        const load = async () => {
            if (!imageId) {
                setState({ url: null, status: 'not-found' });
                return;
            }

            setState({ url: null, status: 'loading' });

            try {
                const blob = await getImage(imageId);
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
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [imageId]);

    return state;
};
