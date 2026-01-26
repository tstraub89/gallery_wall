import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import { saveImage, getImageMetadata, migrateLegacyImages } from '../../utils/imageStore';
import { useImage } from '../../hooks/useImage';
import { v4 as uuidv4 } from 'uuid';
import styles from './PhotoLibrary.module.css';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import FilterBar from './FilterBar';

const PhotoItem = ({ imageId, isUsed, isSelected, onSelect }) => {
    const { url, status } = useImage(imageId);

    const handleDragStart = (e) => {
        // Only allow dragging if image is loaded
        if (status !== 'loaded') {
            e.preventDefault();
            return;
        }
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

    // Loading state
    if (status === 'loading') {
        return <div className={styles.loading}>Loading...</div>;
    }

    // Not found or error state - still selectable for deletion
    if (status === 'not-found' || status === 'error') {
        return (
            <div
                className={`${styles.photoItem} ${styles.notFound} ${isSelected ? styles.selected : ''} `}
                onClick={handleClick}
                title="Photo not found - click to select for deletion"
            >
                <div className={styles.notFoundContent}>
                    <span className={styles.notFoundIcon}>🖼️</span>
                    <span className={styles.notFoundText}>Not Found</span>
                </div>
                {isSelected && <div className={styles.selectedOverlay}>✓</div>}
            </div>
        );
    }

    return (
        <div
            className={`${styles.photoItem} ${isUsed ? styles.used : ''} ${isSelected ? styles.selected : ''} `}
            draggable
            onDragStart={handleDragStart}
            onClick={handleClick}
            title={isUsed ? "This photo is already on the wall" : "Drag to add to a frame"}
        >
            <img src={url} alt="Library Item" />
            {isUsed && <div className={styles.usedLabel}>Use Again</div>}
            {isSelected && <div className={styles.selectedOverlay}>✓</div>}
        </div>
    );
};

const PhotoLibrary = () => {
    const { currentProject, addImageToLibrary, updateProject, selectFrame, selectedImageIds, setSelectedImages, setFocusedArea } = useProject();
    const fileInputRef = useRef(null);
    // Track anchor index for range selection
    const [anchorIndex, setAnchorIndex] = React.useState(null);
    // Delete confirmation dialog
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState(''); // Not used yet but needed for prop
    const [activeFilters, setActiveFilters] = useState({});
    const [sortBy, setSortBy] = useState('newest');

    // Metadata Cache
    const [metadata, setMetadata] = useState({});

    // 1. Run Migration & Fetch Metadata on Mount / Project Change
    useEffect(() => {
        if (!currentProject) return;

        const init = async () => {
            // Run migration silently
            await migrateLegacyImages();

            // Fetch all metadata
            const ids = currentProject.images || [];
            if (ids.length > 0) {
                const meta = await getImageMetadata(ids);
                setMetadata(prev => ({ ...prev, ...meta })); // Merge
            }
        };
        init();
    }, [currentProject?.id, currentProject?.images?.length]);


    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        for (const file of files) {
            try {
                const imageId = uuidv4();
                const result = await saveImage(imageId, file);
                // Result contains metadata, update cache immediately
                setMetadata(prev => ({
                    ...prev,
                    [imageId]: {
                        width: result.width,
                        height: result.height,
                        aspectRatio: result.aspectRatio,
                        name: result.name
                    }
                }));
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
        setFocusedArea('library');

        // Use PROCESSED list for index finding to ensure consistent range select
        const images = processedImages;
        const clickedIndex = images.indexOf(imageId);

        if (e.ctrlKey || e.metaKey) {
            // Toggle selection
            if (selectedImageIds.includes(imageId)) {
                setSelectedImages(selectedImageIds.filter(id => id !== imageId));
            } else {
                setSelectedImages([...selectedImageIds, imageId]);
            }
            // Update anchor to this item
            setAnchorIndex(clickedIndex);
        } else if (e.shiftKey && anchorIndex !== null) {
            // Range select
            const start = Math.min(anchorIndex, clickedIndex);
            const end = Math.max(anchorIndex, clickedIndex);
            const rangeIds = images.slice(start, end + 1);
            setSelectedImages(rangeIds);
        } else {
            // Single select - set as anchor
            setSelectedImages([imageId]);
            setAnchorIndex(clickedIndex);
        }
    };

    // Determine which photos are in use
    const getUsedImageIds = () => {
        return new Set(currentProject.frames.map(f => f.imageId).filter(Boolean));
    };

    // Count how many selected images are in use
    const getInUseCount = () => {
        const usedSet = getUsedImageIds();
        return selectedImageIds.filter(id => usedSet.has(id)).length;
    };

    const handleDeleteClick = React.useCallback(() => {
        if (selectedImageIds.length === 0) return;
        setShowDeleteDialog(true);
    }, [selectedImageIds]);

    const handleDeleteUnused = () => {
        const usedSet = getUsedImageIds();
        const unusedToDelete = selectedImageIds.filter(id => !usedSet.has(id));

        // Remove only unused from library
        const updatedImages = currentProject.images.filter(id => !unusedToDelete.includes(id));
        updateProject(currentProject.id, { images: updatedImages });

        setSelectedImages([]);
        setAnchorIndex(null);
        setShowDeleteDialog(false);
    };

    const handleDeleteAll = () => {
        // Remove from library
        const updatedImages = currentProject.images.filter(id => !selectedImageIds.includes(id));

        // Also remove from any frames using these photos
        const updatedFrames = currentProject.frames.map(frame => {
            if (selectedImageIds.includes(frame.imageId)) {
                return { ...frame, imageId: null };
            }
            return frame;
        });

        updateProject(currentProject.id, {
            images: updatedImages,
            frames: updatedFrames
        });

        setSelectedImages([]);
        setAnchorIndex(null);
        setShowDeleteDialog(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteDialog(false);
    };

    // Keyboard support for Delete
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedImageIds.length > 0) {
                // Check if focus is on an input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                e.preventDefault();
                handleDeleteClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIds, currentProject, updateProject, handleDeleteClick]);

    // Clear selection on background click
    const handleBackgroundClick = (e) => {
        // Don't clear if clicking on photos, action buttons, or dialog
        if (e.target.closest(`.${styles.photoItem}`)) return;
        if (e.target.closest(`.${styles.actions}`)) return;
        if (e.target.closest('[class*="DeleteConfirmDialog"]')) return;
        setSelectedImages([]);
        setAnchorIndex(null);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            try {
                const imageId = uuidv4();
                const result = await saveImage(imageId, file);
                setMetadata(prev => ({
                    ...prev,
                    [imageId]: {
                        width: result.width,
                        height: result.height,
                        aspectRatio: result.aspectRatio,
                        name: result.name
                    }
                }));
                addImageToLibrary(currentProject.id, imageId);
            } catch (err) {
                console.error("Failed to add dropped image to library", err);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    // --- Filtering Logic ---
    const processedImages = useMemo(() => {
        if (!currentProject?.images) return [];
        let result = [...currentProject.images];
        const usedSet = getUsedImageIds();

        // 1. Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(id => {
                const m = metadata[id];
                return m && m.name && m.name.toLowerCase().includes(lower);
            });
        }

        // 2. Filter
        if (activeFilters.unused) {
            result = result.filter(id => !usedSet.has(id));
        }
        if (activeFilters.used) {
            result = result.filter(id => usedSet.has(id));
        }

        if (activeFilters.portrait) {
            result = result.filter(id => {
                const m = metadata[id];
                return m && m.height > m.width;
            });
        }
        if (activeFilters.landscape) {
            result = result.filter(id => {
                const m = metadata[id];
                return m && m.width > m.height;
            });
        }
        if (activeFilters.square) {
            result = result.filter(id => {
                const m = metadata[id];
                return m && Math.abs(m.width - m.height) < 1; // Tolerance for floating point or near-square
            });
        }

        // 3. Sort
        // "Newest" is default storage order (ProjectContext prepends images: [New...Old])
        // So for "Newest" we do nothing.
        // For "Oldest" we reverse.
        if (sortBy === 'oldest') {
            result.reverse();
        }

        return result;

    }, [currentProject?.images, metadata, activeFilters, sortBy, searchTerm]);

    const handleFilterChange = (key, val) => {
        const newFilters = { ...activeFilters, [key]: val };

        // Mutually exclusive logic
        if (key === 'portrait' && val) {
            newFilters.landscape = false;
            newFilters.square = false;
        }
        if (key === 'landscape' && val) {
            newFilters.portrait = false;
            newFilters.square = false;
        }
        if (key === 'square' && val) {
            newFilters.portrait = false;
            newFilters.landscape = false;
        }

        if (key === 'used' && val) newFilters.unused = false;
        if (key === 'unused' && val) newFilters.used = false;

        setActiveFilters(newFilters);
    };


    if (!currentProject) return null;

    // Determine usage
    const usedImageIds = new Set(currentProject.frames.map(f => f.imageId).filter(Boolean));

    return (
        <div
            className={styles.container}
            onClick={handleBackgroundClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className={styles.filterRow}>
                <FilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    showSearch={true}
                    placeholder="Search filename..."
                    sortOptions={[
                        { value: 'newest', label: 'Newest' },
                        { value: 'oldest', label: 'Oldest' }
                    ]}
                    currentSort={sortBy}
                    onSortChange={setSortBy}
                    filterOptions={[
                        { key: 'unused', label: 'Unused Only' },
                        { key: 'used', label: 'Used Only' },
                        { key: 'portrait', label: 'Portrait' },
                        { key: 'landscape', label: 'Landscape' },
                        { key: 'square', label: 'Square' }
                    ]}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                />
            </div>

            <div className={styles.actions}>
                <div className={styles.btnRow}>
                    <button
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        + Add Photos
                    </button>
                    {selectedImageIds.length > 0 && (
                        <button
                            className={styles.deleteBtn}
                            onClick={handleDeleteClick}
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
                    {processedImages.length > 0 ? (
                        processedImages.map(imageId => (
                            <PhotoItem
                                key={imageId}
                                imageId={imageId}
                                isUsed={usedImageIds.has(imageId)}
                                isSelected={selectedImageIds.includes(imageId)}
                                onSelect={(e) => handleSelect(imageId, e)}
                            />
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            {currentProject.images.length === 0 ? "No photos yet." : "No matching photos."}
                        </div>
                    )}
                </div>
            </div>

            {showDeleteDialog && (
                <DeleteConfirmDialog
                    selectedCount={selectedImageIds.length}
                    inUseCount={getInUseCount()}
                    onDeleteUnused={handleDeleteUnused}
                    onDeleteAll={handleDeleteAll}
                    onCancel={handleCancelDelete}
                />
            )}
        </div>
    );
};

export default PhotoLibrary;
