import React, { useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { saveImage } from '../../utils/imageStore';
import { useImage } from '../../hooks/useImage';
import { v4 as uuidv4 } from 'uuid';
import styles from './PhotoLibrary.module.css';

const PhotoItem = ({ imageId, isUsed }) => {
    const imageUrl = useImage(imageId);

    const handleDragStart = (e) => {
        // We can pass data to drop handler
        // We want to pass the imageId so the canvas knows what to render
        // But also we might want to say "This is a library item"
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'PHOTO_LIBRARY_ITEM',
            imageId
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    if (!imageUrl) return <div className={styles.loading}>Loading...</div>;

    return (
        <div
            className={`${styles.photoItem} ${isUsed ? styles.used : ''}`}
            draggable
            onDragStart={handleDragStart}
            title={isUsed ? "This photo is already on the wall" : "Drag to add to a frame"}
        >
            <img src={imageUrl} alt="Library Item" />
            {isUsed && <div className={styles.usedLabel}>Use Again</div>}
        </div>
    );
};

const PhotoLibrary = () => {
    const { currentProject, addImageToLibrary, updateProject } = useProject();
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            try {
                const imageId = uuidv4();
                await saveImage(imageId, file);
                addImageToLibrary(currentProject.id, imageId);
            } catch (err) {
                console.error("Failed to add image to library", err);
            }
        }

        // Reset input
        e.target.value = '';
    };

    if (!currentProject) return null;

    // Determine usage
    const usedImageIds = new Set(currentProject.frames.map(f => f.imageId).filter(Boolean));

    return (
        <div className={styles.container}>
            <div className={styles.actions}>
                <button
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current?.click()}
                >
                    + Add Photos
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                />
            </div>

            <div className={styles.grid}>
                {currentProject.images && currentProject.images.length > 0 ? (
                    currentProject.images.map(imageId => (
                        <PhotoItem
                            key={imageId}
                            imageId={imageId}
                            isUsed={usedImageIds.has(imageId)}
                        />
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        No photos yet. Click "Add Photos" or drag them here to start.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoLibrary;
