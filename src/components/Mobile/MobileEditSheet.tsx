import React, { useState } from 'react';
import { useProject } from '../../hooks/useProject';
import styles from './MobileLibrarySheet.module.css';
import { RotateCw, ImageMinus, Palette, Square, Image, Frame as FrameIcon, Trash2 } from 'lucide-react';

interface MobileEditSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileEditSheet: React.FC<MobileEditSheetProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'frame' | 'photo'>('frame');

    const {
        currentProject,
        updateProject,
        selectedFrameIds
    } = useProject();

    if (!isOpen || !currentProject) return null;

    // Get selected frames
    const selectedFrames = currentProject.frames.filter(f => selectedFrameIds.includes(f.id));
    const hasSelection = selectedFrames.length > 0;
    const hasPhoto = selectedFrames.some(f => f.imageId);

    // -- Frame Property Handlers --
    const updateFrameProperty = <K extends 'frameColor' | 'borderWidth' | 'rotation'>(
        key: K,
        value: typeof currentProject.frames[0][K]
    ) => {
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                return { ...f, [key]: value };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const rotateFrames = () => {
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                // Swap width and height for both frame and mat opening
                const newMatted = f.matted ? {
                    width: f.matted.height,
                    height: f.matted.width
                } : undefined;

                return {
                    ...f,
                    width: f.height,
                    height: f.width,
                    matted: newMatted,
                    rotation: ((f.rotation || 0) + 90) % 360
                };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const deleteFrames = () => {
        const updatedFrames = currentProject.frames.filter(f => !selectedFrameIds.includes(f.id));
        updateProject(currentProject.id, { frames: updatedFrames });
        onClose();  // Close sheet after delete
    };

    // -- Photo Property Handlers --
    const updatePhotoProperty = (field: 'scale' | 'x' | 'y', value: number) => {
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id) && f.imageId) {
                const currentState = f.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
                return { ...f, imageState: { ...currentState, [field]: value } };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const rotatePhotos = () => {
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id) && f.imageId) {
                const currentState = f.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
                return { ...f, imageState: { ...currentState, rotation: (currentState.rotation + 90) % 360 } };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const removePhotos = () => {
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                return { ...f, imageId: null, imageState: null };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    // Get current values (for display)
    const getFrameValue = <K extends keyof typeof selectedFrames[0]>(key: K) => {
        if (selectedFrames.length === 0) return undefined;
        const first = selectedFrames[0][key];
        const allSame = selectedFrames.every(f => f[key] === first);
        return allSame ? first : undefined;
    };

    const getPhotoValue = (field: 'scale' | 'x' | 'y') => {
        const framesWithPhotos = selectedFrames.filter(f => f.imageId);
        if (framesWithPhotos.length === 0) return undefined;
        const first = framesWithPhotos[0].imageState?.[field] ?? (field === 'scale' ? 1 : 0);
        const allSame = framesWithPhotos.every(f => {
            const val = f.imageState?.[field] ?? (field === 'scale' ? 1 : 0);
            return Math.abs(val - first) < 0.01;
        });
        return allSame ? first : undefined;
    };

    return (
        <>
            {/* Backdrop - tapping outside closes */}
            <div className={styles.backdrop} onClick={onClose} />

            {/* Compact Sheet - 40% height for seeing canvas */}
            <div className={styles.sheet} style={{ maxHeight: '320px' }}>
                {/* Grab handle */}
                <div className={styles.grabHandle} />

                {/* Header with tabs */}
                <div className={styles.sheetHeader}>
                    {hasSelection && hasPhoto ? (
                        <div className={styles.headerTabs}>
                            <button
                                className={`${styles.headerTab} ${activeTab === 'frame' ? styles.activeHeaderTab : ''}`}
                                onClick={() => setActiveTab('frame')}
                            >
                                <Square size={16} />
                                Frame
                            </button>
                            <button
                                className={`${styles.headerTab} ${activeTab === 'photo' ? styles.activeHeaderTab : ''}`}
                                onClick={() => setActiveTab('photo')}
                            >
                                <Image size={16} />
                                Photo
                            </button>
                        </div>
                    ) : (
                        <span className={styles.sheetTitle}>{hasSelection ? 'Frame' : 'Edit'}</span>
                    )}
                    <button className={styles.closeBtn} onClick={onClose}>Done</button>
                </div>

                {!hasSelection ? (
                    <div className={styles.sheetContent} style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                        <FrameIcon size={48} strokeWidth={1} style={{ opacity: 0.5, marginBottom: 12 }} />
                        <p>Select a frame to edit its properties</p>
                    </div>
                ) : (
                    <>

                        {/* Content */}
                        <div className={styles.sheetContent}>
                            {(activeTab === 'frame' || !hasPhoto) && (
                                <div className={styles.editSection}>
                                    {/* Frame Color */}
                                    <div className={styles.editRow}>
                                        <label><Palette size={16} /> Color</label>
                                        <input
                                            type="color"
                                            value={getFrameValue('frameColor') as string || '#111111'}
                                            onChange={(e) => updateFrameProperty('frameColor', e.target.value)}
                                            className={styles.colorInput}
                                        />
                                    </div>

                                    {/* Border Width */}
                                    <div className={styles.editRow}>
                                        <label>Border</label>
                                        <div className={styles.sliderRow}>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.1"
                                                value={(getFrameValue('borderWidth') as number) ?? 0.5}
                                                onChange={(e) => updateFrameProperty('borderWidth', parseFloat(e.target.value))}
                                                className={styles.slider}
                                            />
                                            <span className={styles.sliderValue}>
                                                {((getFrameValue('borderWidth') as number) ?? 0.5).toFixed(1)}"
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rotate Frame */}
                                    <button className={styles.actionBtn} onClick={rotateFrames}>
                                        <RotateCw size={18} />
                                        Rotate Frame 90°
                                    </button>

                                    {/* Delete Frame */}
                                    <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={deleteFrames}>
                                        <Trash2 size={18} />
                                        Delete Frame{selectedFrames.length > 1 ? 's' : ''}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'photo' && hasPhoto && (
                                <div className={styles.editSection}>
                                    {/* Scale */}
                                    <div className={styles.editRow}>
                                        <label>Scale</label>
                                        <div className={styles.sliderRow}>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="3"
                                                step="0.1"
                                                value={getPhotoValue('scale') ?? 1}
                                                onChange={(e) => updatePhotoProperty('scale', parseFloat(e.target.value))}
                                                className={styles.slider}
                                            />
                                            <span className={styles.sliderValue}>
                                                {(getPhotoValue('scale') ?? 1).toFixed(1)}x
                                            </span>
                                        </div>
                                    </div>

                                    {/* Position X */}
                                    <div className={styles.editRow}>
                                        <label>Position X</label>
                                        <div className={styles.sliderRow}>
                                            <input
                                                type="range"
                                                min="-200"
                                                max="200"
                                                step="5"
                                                value={getPhotoValue('x') ?? 0}
                                                onChange={(e) => updatePhotoProperty('x', parseFloat(e.target.value))}
                                                className={styles.slider}
                                            />
                                            <span className={styles.sliderValue}>
                                                {Math.round(getPhotoValue('x') ?? 0)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Position Y */}
                                    <div className={styles.editRow}>
                                        <label>Position Y</label>
                                        <div className={styles.sliderRow}>
                                            <input
                                                type="range"
                                                min="-200"
                                                max="200"
                                                step="5"
                                                value={getPhotoValue('y') ?? 0}
                                                onChange={(e) => updatePhotoProperty('y', parseFloat(e.target.value))}
                                                className={styles.slider}
                                            />
                                            <span className={styles.sliderValue}>
                                                {Math.round(getPhotoValue('y') ?? 0)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rotate Photo */}
                                    <button className={styles.actionBtn} onClick={rotatePhotos}>
                                        <RotateCw size={18} />
                                        Rotate Photo 90°
                                    </button>

                                    {/* Remove Photo */}
                                    <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={removePhotos}>
                                        <ImageMinus size={18} />
                                        Remove Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default MobileEditSheet;
