import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import { useProject } from '../../hooks/useProject';
import { saveImage, migrateLegacyImages } from '../../utils/imageStore';
import { useImage } from '../../hooks/useImage';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { v4 as uuidv4 } from 'uuid';
import styles from './PhotoLibrary.module.css';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import FilterBar from './FilterBar';
import { Frame } from '../../types';
import { trackEvent, APP_EVENTS } from '../../utils/analytics';

const EMPTY_STRINGS: string[] = [];
const EMPTY_FRAMES: Frame[] = [];

interface PhotoItemProps {
    imageId: string;
    isUsed: boolean;
    isSelected: boolean;
    imageType?: 'thumb' | 'preview';
    onSelect: (e: MouseEvent) => void;
}

// Memoize options to prevent effect re-running
const OBSERVER_OPTIONS = { rootMargin: '2000px' };

const PhotoItem: React.FC<PhotoItemProps> = ({ imageId, isUsed, isSelected, imageType = 'thumb', onSelect }) => {
    const [ref, isVisible] = useIntersectionObserver(OBSERVER_OPTIONS);
    const { url, status } = useImage(imageId, imageType, isVisible ?? false);

    const handleDragStart = (e: React.DragEvent) => {
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

    const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        onSelect(e);
    };

    return (
        <div
            ref={ref as React.RefObject<HTMLDivElement>}
            className={`${styles.photoItem} ${isUsed ? styles.used : ''} ${isSelected ? styles.selected : ''}`}
            draggable={status === 'loaded'}
            onDragStart={handleDragStart}
            onClick={handleClick}
            title={isUsed ? "This photo is already on the wall" : "Drag to add to a frame"}
            style={{
                minHeight: status === 'loaded' ? 'auto' : '120px',
                display: status === 'loaded' ? 'block' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {status === 'loading' ? (
                <div className={styles.loading}>Loading...</div>
            ) : (status === 'not-found' || status === 'error') ? (
                <div className={styles.notFoundContent}>
                    <span className={styles.notFoundIcon}>🖼️</span>
                    <span className={styles.notFoundText}>Not Found</span>
                </div>
            ) : (
                <>
                    <img src={url || undefined} alt="Library Item" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    {isUsed && <div className={styles.usedLabel}>Used Again</div>}
                    {isSelected && <div className={styles.selectedOverlay}>✓</div>}
                </>
            )}
        </div>
    );
};

const PhotoItemThumb: React.FC<{ imageId: string }> = ({ imageId }) => {
    const [ref, isVisible] = useIntersectionObserver();
    const { url, status } = useImage(imageId, 'thumb', isVisible ?? false);

    return (
        <div ref={ref as React.RefObject<HTMLDivElement>} style={{ width: '100%', height: '100%' }}>
            {status === 'loaded' ? (
                <img src={url || undefined} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '100%', background: '#eee' }} />
            )}
        </div>
    );
};

interface PhotoLibraryProps {
    onPhotoSelect?: (imageId: string) => void;
    selectionMode?: 'standard' | 'toggle';
    viewMode?: 'list' | 'grid';
    onViewModeChange?: (mode: 'list' | 'grid') => void;
    zoomLevel?: 'small' | 'medium' | 'large' | 'xlarge';
    onZoomLevelChange?: (level: 'small' | 'medium' | 'large' | 'xlarge') => void;
}

const PhotoLibrary: React.FC<PhotoLibraryProps> = ({
    onPhotoSelect,
    selectionMode = 'standard',
    viewMode = 'grid',
    onViewModeChange,
    zoomLevel = 'medium',
    onZoomLevelChange
}) => {
    // ... imports ...
    const {
        currentProject,
        addImageToLibrary,
        selectedImageIds,
        setSelectedImages,
        isLoaded,
        libraryState,
        updateLibraryState,
        updateProject,
        setSelection,
        setFocusedArea
    } = useProject();

    const fileInputRef = useRef<HTMLInputElement>(null);
    // Track anchor index for range selection
    const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
    // Delete confirmation dialog
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Filter State
    // Persistent State
    const { searchTerm, activeFilters, sortBy } = libraryState;

    // Metadata from Context (Hoisted)
    const { imagesMetadata: metadata } = useProject();

    // Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });

    // Migration Check (still needed, but maybe move to Context? Leaving for now as it's safe)
    useEffect(() => {
        if (!currentProject || !isLoaded) return;
        migrateLegacyImages();
    }, [currentProject, isLoaded]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        trackEvent(APP_EVENTS.IMPORT_IMAGE);
        if (!currentProject) return;

        setIsProcessing(true);
        setProcessingProgress({ current: 0, total: files.length });

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Update progress at start of item
                setProcessingProgress(prev => ({ ...prev, current: i + 1 }));

                try {
                    const imageId = uuidv4();
                    const result = await saveImage(imageId, file);
                    const newMeta = {
                        width: result.width,
                        height: result.height,
                        aspectRatio: result.aspectRatio,
                        name: result.name
                    };
                    addImageToLibrary(currentProject.id, imageId, newMeta);
                } catch (err) {
                    console.error("Failed to add image to library", err);
                }
            }
        } finally {
            setIsProcessing(false);
            setProcessingProgress({ current: 0, total: 0 });
            // Reset input
            e.target.value = '';
        }
    };

    // Forward declaration for hoisting
    let processedImages: string[] = [];

    const handleSelect = (imageId: string, e: MouseEvent) => {
        // Mode 1: Selection Callback (e.g. Mobile Tap to Add)
        if (onPhotoSelect && selectionMode !== 'toggle' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            onPhotoSelect(imageId);
            return;
        }

        // Mode 2: Standard Desktop / Batch Management
        // Deselect frames on canvas
        setSelection([]);
        setFocusedArea('library');

        // Use PROCESSED list for index finding to ensure consistent range select
        const images = processedImages;
        const clickedIndex = images.indexOf(imageId);

        const isToggle = selectionMode === 'toggle' || e.ctrlKey || e.metaKey;

        if (isToggle) {
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
    const getUsedImageIds = React.useCallback(() => {
        const frames = currentProject?.frames || EMPTY_FRAMES;
        return new Set(frames.map(f => f.imageId).filter(Boolean) as string[]);
    }, [currentProject]);

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
        if (!currentProject) return;
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
        if (!currentProject) return;
        // Remove from library
        const updatedImages = currentProject.images.filter(id => !selectedImageIds.includes(id));

        // Also remove from any frames using these photos
        const updatedFrames = currentProject.frames.map(frame => {
            if (frame.imageId && selectedImageIds.includes(frame.imageId)) {
                return { ...frame, imageId: null }; // or undefined
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Backspace' || e.key === 'Delete') && selectedImageIds.length > 0) {
                // Check if focus is on an input
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
                e.preventDefault();
                handleDeleteClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImageIds, currentProject, updateProject, handleDeleteClick]);

    // Clear selection on background click
    const handleBackgroundClick = (e: React.MouseEvent) => {
        // Don't clear if clicking on photos, action buttons, or dialog
        const target = e.target as HTMLElement;
        if (target.closest(`.${styles.photoItem}`)) return;
        if (target.closest(`.${styles.listItem}`)) return;
        if (target.closest(`.${styles.actions}`)) return;
        if (target.closest('[class*="DeleteConfirmDialog"]')) return;
        setSelectedImages([]);
        setAnchorIndex(null);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentProject) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        trackEvent(APP_EVENTS.IMPORT_IMAGE);
        setIsProcessing(true);
        setProcessingProgress({ current: 0, total: files.length });

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                // Update progress
                setProcessingProgress(prev => ({ ...prev, current: i + 1 }));

                try {
                    const imageId = uuidv4();
                    const result = await saveImage(imageId, file);
                    const newMeta = {
                        width: result.width,
                        height: result.height,
                        aspectRatio: result.aspectRatio,
                        name: result.name
                    };
                    addImageToLibrary(currentProject.id, imageId, newMeta);
                } catch (err) {
                    console.error("Failed to add dropped image to library", err);
                }
            }
        } finally {
            setIsProcessing(false);
            setProcessingProgress({ current: 0, total: 0 });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    const images = currentProject?.images || EMPTY_STRINGS;
    const frames = currentProject?.frames || EMPTY_FRAMES;

    // --- Filtering Logic ---
    const calculateProcessedImages = () => {
        let result = [...images];
        const usedSet = new Set(frames.map(f => f.imageId).filter(Boolean) as string[]);

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
        if (sortBy === 'newest') {
            // Assuming input is Oldest -> Newest
            result.reverse();
        } else if (sortBy === 'name_asc') {
            result.sort((a, b) => (metadata[a]?.name || '').localeCompare(metadata[b]?.name || ''));
        } else if (sortBy === 'name_desc') {
            result.sort((a, b) => (metadata[b]?.name || '').localeCompare(metadata[a]?.name || ''));
        } else if (sortBy === 'size_desc') { // Largest
            result.sort((a, b) => {
                const areaA = (metadata[a]?.width || 0) * (metadata[a]?.height || 0);
                const areaB = (metadata[b]?.width || 0) * (metadata[b]?.height || 0);
                return areaB - areaA;
            });
        } else if (sortBy === 'size_asc') { // Smallest
            result.sort((a, b) => {
                const areaA = (metadata[a]?.width || 0) * (metadata[a]?.height || 0);
                const areaB = (metadata[b]?.width || 0) * (metadata[b]?.height || 0);
                return areaA - areaB;
            });
        }
        // 'oldest' -> leave as is (assuming source is oldest first)

        return result;
    };

    processedImages = calculateProcessedImages();

    const handleFilterChange = (key: string, val: boolean) => {
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

        updateLibraryState({ activeFilters: newFilters });
    };


    if (!isLoaded) {
        return <div className={styles.empty}>Loading...</div>;
    }

    if (!currentProject) {
        return <div className={styles.empty}>Select or create a project.</div>;
    }

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
                    onSearchChange={(val) => updateLibraryState({ searchTerm: val })}
                    showSearch={true}
                    placeholder="Search filename..."
                    sortOptions={[
                        { value: 'newest', label: 'Newest' },
                        { value: 'oldest', label: 'Oldest' },
                        { value: 'name_asc', label: 'Name (A-Z)' },
                        { value: 'name_desc', label: 'Name (Z-A)' },
                        { value: 'size_desc', label: 'Size (Largest)' },
                        { value: 'size_asc', label: 'Size (Smallest)' }
                    ]}
                    currentSort={sortBy}
                    onSortChange={(val) => updateLibraryState({ sortBy: val })}
                    filterOptions={[
                        { key: 'unused', label: 'Unused Only' },
                        { key: 'used', label: 'Used Only' },
                        { key: 'portrait', label: 'Portrait' },
                        { key: 'landscape', label: 'Landscape' },
                        { key: 'square', label: 'Square' }
                    ]}
                    activeFilters={activeFilters}
                    onFilterChange={handleFilterChange}
                    onClear={() => updateLibraryState({ activeFilters: {} })}
                    viewOptions={[
                        {
                            id: 'list',
                            label: 'List View',
                            checked: viewMode === 'list',
                            type: 'item',
                            onClick: () => onViewModeChange?.('list')
                        },
                        {
                            id: 'grid',
                            label: 'Grid View',
                            checked: viewMode === 'grid',
                            type: 'item',
                            onClick: () => onViewModeChange?.('grid')
                        },
                        {
                            id: 'sep1',
                            label: '',
                            type: 'divider'
                        },
                        {
                            id: 'hdr_zoom',
                            label: 'Grid Size',
                            type: 'header'
                        },
                        {
                            id: 'small',
                            label: 'Small',
                            checked: zoomLevel === 'small',
                            disabled: viewMode !== 'grid',
                            type: 'item',
                            onClick: () => onZoomLevelChange?.('small')
                        },
                        {
                            id: 'medium',
                            label: 'Medium',
                            checked: zoomLevel === 'medium',
                            disabled: viewMode !== 'grid',
                            type: 'item',
                            onClick: () => onZoomLevelChange?.('medium')
                        },
                        {
                            id: 'large',
                            label: 'Large',
                            checked: zoomLevel === 'large',
                            disabled: viewMode !== 'grid',
                            type: 'item',
                            onClick: () => onZoomLevelChange?.('large')
                        },
                        {
                            id: 'xlarge',
                            label: 'Extra Large',
                            checked: zoomLevel === 'xlarge',
                            disabled: viewMode !== 'grid',
                            type: 'item',
                            onClick: () => onZoomLevelChange?.('xlarge')
                        }
                    ]}
                />
            </div>

            < div className={styles.actions} >
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
            </div >

            <div className={styles.scrollWrapper}>
                {viewMode === 'grid' ? (
                    <div className={`${styles.masonryGrid} ${styles[zoomLevel]}`}>
                        {processedImages.length > 0 ? (
                            processedImages.map(imageId => (
                                <PhotoItem
                                    key={imageId}
                                    imageId={imageId}
                                    isUsed={usedImageIds.has(imageId)}
                                    isSelected={selectedImageIds.includes(imageId)}
                                    imageType={zoomLevel === 'xlarge' ? 'preview' : 'thumb'}
                                    onSelect={(e) => handleSelect(imageId, e)}
                                />
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                {currentProject.images.length === 0 ? "No photos yet." : "No matching photos."}
                            </div>
                        )}
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className={styles.listView}>
                        {processedImages.length > 0 ? (
                            processedImages.map(imageId => {
                                const m = metadata[imageId];
                                const isUsed = usedImageIds.has(imageId);
                                const isSelected = selectedImageIds.includes(imageId);

                                return (
                                    <div
                                        key={imageId}
                                        className={`${styles.listItem} ${isSelected ? styles.selected : ''}`}
                                        onClick={(e) => handleSelect(imageId, e as unknown as MouseEvent)}
                                        draggable={true}
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/json', JSON.stringify({
                                                type: 'PHOTO_LIBRARY_ITEM',
                                                imageId
                                            }));
                                        }}
                                    >
                                        <div style={{ width: 40, height: 40, background: '#eee', flexShrink: 0 }}>
                                            {/* We can reuse useImage logic here if we extract it or just assume it's loaded if visible? 
                                                For list view, we might want a simpler thumb loader.
                                                Let's stick to PhotoItem for now but style it different? 
                                                No, PhotoItem is structural. Let's make a PhotoListItem or inline it.
                                                Ideally we use the same hook. Let's create a minimal thumb here.
                                            */}
                                            <PhotoItemThumb imageId={imageId} />
                                        </div>
                                        <div className={styles.listInfo}>
                                            <div className={styles.listName} title={m?.name}>{m?.name || 'Untitled'}</div>
                                            <div className={styles.listMeta}>
                                                {m ? (
                                                    <>
                                                        <span style={{ whiteSpace: 'nowrap' }}>{m.width} x {m.height} px</span>
                                                        <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
                                                        <span style={{ whiteSpace: 'nowrap' }}>{((m.width * m.height) / 1000000).toFixed(1)} MP</span>
                                                        <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
                                                        <span style={{ whiteSpace: 'nowrap' }}>Ratio: {m.aspectRatio?.toFixed(2)}</span>
                                                    </>
                                                ) : 'Loading...'}
                                            </div>
                                        </div>
                                        <div>
                                            {isUsed && <span className={`${styles.listStatus} ${styles.used}`}>Placed</span>}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={styles.emptyState}>
                                {currentProject.images.length === 0 ? "No photos yet." : "No matching photos."}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {
                showDeleteDialog && (
                    <DeleteConfirmDialog
                        selectedCount={selectedImageIds.length}
                        inUseCount={getInUseCount()}
                        onDeleteUnused={handleDeleteUnused}
                        onDeleteAll={handleDeleteAll}
                        onCancel={handleCancelDelete}
                    />
                )
            }

            {
                isProcessing && (
                    <div className={styles.processingOverlay}>
                        <div className={styles.spinner} />
                        <div className={styles.processingText}>
                            Processing photos... ({processingProgress.current}/{processingProgress.total})
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PhotoLibrary;
