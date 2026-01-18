import { useState, useEffect } from 'react';
import { getImage } from '../utils/imageStore';

export const useImage = (imageId) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        let active = true;
        let objectUrl = null;

        const load = async () => {
            if (!imageId) {
                setImageUrl(null);
                return;
            }

            try {
                const blob = await getImage(imageId);
                if (blob && active) {
                    objectUrl = URL.createObjectURL(blob);
                    setImageUrl(objectUrl);
                }
            } catch (err) {
                console.error("Failed to load image", imageId, err);
            }
        };

        load();

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [imageId]);

    return imageUrl;
};
