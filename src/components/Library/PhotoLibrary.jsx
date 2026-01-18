import React, { useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { saveImage } from '../../utils/imageStore';
import { useImage } from '../../hooks/useImage';
import { v4 as uuidv4 } from 'uuid';
import styles from './PhotoLibrary.module.css';

const PhotoItem = ({ imageId, isUsed, isSelected, onSelect }) => {
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

    const handleClick = (e) => {
        e.stopPropagation();
        onSelect(e);
    };

    if (!imageUrl) return <div className={styles.loading}>Loading...</div>;

    return (
        <div
            className={`${styles.photoItem} ${isUsed ? styles.used : ''} ${isSelected ? styles.selected : ''}`}
            draggable
            onDragStart={handleDragStart}
            onClick={handleClick}
            title={isUsed ? "This photo is already on the wall" : "Drag to add to a frame"}
        >
            <img src={imageUrl} alt="Library Item" />
            {isUsed && <div className={styles.usedLabel}>Use Again</div>}
            {isSelected && <div className={styles.selectedOverlay}>✓</div>}
        </div>
    );
};

const PhotoLibrary = () => {
    const { currentProject, addImageToLibrary, updateProject, selectFrame } = useProject();
    const fileInputRef = useRef(null);
    const [selectedImages, setSelectedImages] = React.useState([]);

    // Clear frame selection when selecting photos and vice versa?
    // Accessing `selectFrame` from context.

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

    const handleSelect = (imageId, e) => {
        // Deselect frames on canvas
        selectFrame(null);

        if (e.ctrlKey || e.metaKey) {
            // Toggle
            setSelectedImages(prev =>
                prev.includes(imageId)
                    ? prev.filter(id => id !== imageId)
                    : [...prev, imageId]
            );
        } else if (e.shiftKey) {
            // Range select logic is hard in masonry, simpler shift logic: add to selection
            setSelectedImages(prev =>
                prev.includes(imageId) ? prev : [...prev, imageId]
            );
        } else {
            // Single select
            setSelectedImages([imageId]);
        }
    };

    const handleDelete = () => {
        if (selectedImages.length === 0) return;

        // Remove from project images
        const updatedImages = currentProject.images.filter(id => !selectedImages.includes(id));
        updateProject(currentProject.id, { images: updatedImages });
        setSelectedImages([]);
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedImages.length > 0) {
                e.preventDefault();
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImages, currentProject, updateProject]);

    // Clear selection on background click
    const handleBackgroundClick = (e) => {
        if (e.target.closest(`.${styles.photoItem}`)) return;
        setSelectedImages([]);
    };

    if (!currentProject) return null;

    // Determine usage
    const usedImageIds = new Set(currentProject.frames.map(f => f.imageId).filter(Boolean));

    return (
        <div className={styles.container} onClick={handleBackgroundClick}>
            <div className={styles.actions}>
                <div className={styles.btnRow}>
                    <button
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        + Add Photos
                    </button>
                    {selectedImages.length > 0 && (
                        <button
                            className={styles.deleteBtn}
                            onClick={handleDelete}
                            title="Delete Selected Photos"
                        >
                            🗑️
                        </button>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                />
            </div>

            <div className={styles.scrollWrapper}>
                <div className={styles.masonryGrid}>
                    {currentProject.images && currentProject.images.length > 0 ? (
                        currentProject.images.map(imageId => (
                            <PhotoItem
                                key={imageId}
                                imageId={imageId}
                                isUsed={usedImageIds.has(imageId)}
                                isSelected={selectedImages.includes(imageId)}
                                onSelect={(e) => handleSelect(imageId, e)}
                            />
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            No photos yet. Click "Add Photos" or drag them here to start.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhotoLibrary;
