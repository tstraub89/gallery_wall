import React, { useState, useRef } from 'react';
import { useProject } from '../../hooks/useProject';
import styles from './MobileLibrarySheet.module.css';
import { RotateCw, ImageMinus, Palette, Square, Image, Frame as FrameIcon, Trash2 } from 'lucide-react';
import { useSwipeDismiss } from '../../hooks/useSwipeDismiss';

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

    // Scroll Ref for swipe detection
    const scrollRef = useRef<HTMLDivElement>(null);

    // Swipe Dismiss Hook
    const { handlers, swipeStyle, triggerDismiss } = useSwipeDismiss({
        onDismiss: onClose,
        isOpen,
        scrollRef
    });

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
            {/* Backdrop - tapping outside triggers dismiss animation */}
            <div className={styles.backdrop} onClick={triggerDismiss} />

            {/* Compact Sheet - 40% height for seeing canvas */}
            <div
                className={styles.sheet}
                style={{ maxHeight: '320px', ...swipeStyle }}
                {...handlers}
            >
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
                        <span className={styles.sheetTitle}>{hasSelection ? 'Frame Properties' : 'Wall Properties'}</span>
                    )}
                    <button className={styles.closeBtn} onClick={triggerDismiss}>Done</button>
                </div>

                {/* Scrollable Content Area */}
                <div
                    ref={scrollRef}
                    style={{ overflowY: 'auto', flex: 1, overscrollBehaviorY: 'contain' }}
                >
                    {!hasSelection ? (
                        <div className={styles.editSection}>
                            {/* Wall Name */}
                            <div className={styles.editRow}>
                                <label>Wall Name</label>
                                <input
                                    type="text"
                                    value={currentProject.name}
                                    onChange={(e) => updateProject(currentProject.id, { name: e.target.value })}
                                    className={styles.textInput}
                                    style={{ flex: 1 }}
                                />
                            </div>

                            {/* Dimensions */}
                            <div className={styles.editRow}>
                                <label>Dimensions</label>
                                <div className={styles.dimGroup}>
                                    <div className={styles.dimInputWrapper}>
                                        <input
                                            type="number"
                                            value={currentProject.wallConfig.width}
                                            onChange={(e) => updateProject(currentProject.id, { wallConfig: { ...currentProject.wallConfig, width: Number(e.target.value) } })}
                                            className={styles.numInput}
                                        />
                                        <span className={styles.dimUnit}>W"</span>
                                    </div>
                                    <span style={{ color: 'var(--text-secondary)' }}>×</span>
                                    <div className={styles.dimInputWrapper}>
                                        <input
                                            type="number"
                                            value={currentProject.wallConfig.height}
                                            onChange={(e) => updateProject(currentProject.id, { wallConfig: { ...currentProject.wallConfig, height: Number(e.target.value) } })}
                                            className={styles.numInput}
                                        />
                                        <span className={styles.dimUnit}>H"</span>
                                    </div>
                                </div>
                            </div>

                            {/* Wall Type */}
                            <div className={styles.editRow}>
                                <label>Wall Type</label>
                                <select
                                    value={currentProject.wallConfig.type}
                                    onChange={(e) => updateProject(currentProject.id, { wallConfig: { ...currentProject.wallConfig, type: e.target.value as any } })}
                                    className={styles.selectInput}
                                    style={{ flex: 1 }}
                                >
                                    <option value="flat">Flat Wall</option>
                                    <option value="staircase-asc">Staircase (Ascending)</option>
                                    <option value="staircase-desc">Staircase (Descending)</option>
                                </select>
                            </div>

                            {/* Stair Rise & Wall Color (Conditional Layout) */}
                            {(currentProject.wallConfig.type === 'staircase-asc' || currentProject.wallConfig.type === 'staircase-desc') ? (
                                <div className={styles.editRow}>
                                    {/* Left: Rise Slider takes available space */}
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <label style={{ minWidth: 'auto' }}>Rise</label>
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            value={currentProject.wallConfig.stairAngle ?? 50}
                                            onChange={(e) => updateProject(currentProject.id, { wallConfig: { ...currentProject.wallConfig, stairAngle: Number(e.target.value) } })}
                                            className={styles.slider}
                                        />
                                        <span className={styles.sliderValue} style={{ minWidth: 24 }}>{currentProject.wallConfig.stairAngle ?? 50}%</span>
                                    </div>

                                    {/* Right: Compact Wall Color */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.1, textAlign: 'right', color: 'var(--text-primary)' }}>
                                            Wall<br />Color
                                        </span>
                                        <input
                                            type="color"
                                            value={currentProject.wallConfig.backgroundColor || '#e0e0e0'}
                                            onChange={(e) => updateProject(currentProject.id, { wallConfig: { ...currentProject.wallConfig, backgroundColor: e.target.value } })}
                                            className={styles.colorInput}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Standard Wall Color Row (Flat) */
                                <div className={styles.editRow} style={{ justifyContent: 'flex-end', gap: 12 }}>
                                    <label style={{ minWidth: 'auto', color: 'var(--text-secondary)' }}>
                                        <Palette size={16} /> Wall Color
                                    </label>
                                    <input
                                        type="color"
                                        value={currentProject.wallConfig.backgroundColor || '#e0e0e0'}
                                        onChange={(e) => updateProject(currentProject.id, { wallConfig: { ...currentProject.wallConfig, backgroundColor: e.target.value } })}
                                        className={styles.colorInput}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
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
                                                max="5"
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

                                    {/* Matting Toggle */}
                                    <div className={styles.toggleRow} onClick={() => {
                                        const hasMat = selectedFrames.every(f => !!f.matted);
                                        const updatedFrames = currentProject.frames.map(f => {
                                            if (selectedFrameIds.includes(f.id)) {
                                                if (hasMat) {
                                                    return { ...f, matted: undefined };
                                                } else {
                                                    // Default Mat: 2 inches smaller than frame (1 inch each side)
                                                    // Clamp to minimum 1 inch opening
                                                    const matW = Math.max(1, f.width - 2);
                                                    const matH = Math.max(1, f.height - 2);
                                                    return { ...f, matted: { width: matW, height: matH } };
                                                }
                                            }
                                            return f;
                                        });
                                        updateProject(currentProject.id, { frames: updatedFrames });
                                    }}>
                                        <div className={styles.toggleLabel}>
                                            <FrameIcon size={16} /> Matting
                                        </div>
                                        <div className={`${styles.switch} ${selectedFrames.every(f => !!f.matted) ? styles.switchChecked : ''}`}>
                                            <div className={styles.switchHandle} />
                                        </div>
                                    </div>

                                    {/* Compact Actions */}
                                    <div className={styles.compactRow}>
                                        <button className={styles.actionBtn} onClick={rotateFrames}>
                                            <RotateCw size={18} />
                                            Rotate
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={deleteFrames}>
                                            <Trash2 size={18} />
                                            Delete
                                        </button>
                                    </div>
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
                    )}
                </div>
            </div >
        </>
    );
};

export default MobileEditSheet;
