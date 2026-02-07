import React, { useState, useRef } from 'react';
import { useSwipeDismiss } from '../../hooks/useSwipeDismiss';
import { useProject } from '../../hooks/useProject';
import FrameList from '../Library/FrameList';
import PhotoLibrary from '../Library/PhotoLibrary';
import { Frame } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import styles from './MobileLibrarySheet.module.css';
import { useViewport } from '../../context/ViewportContext';
import MobileAddFrameDialog from './MobileAddFrameDialog';
import MobileCommonFrameDialog from './MobileCommonFrameDialog';
import { SmartLayoutProvider } from '../Library/SmartLayout/SmartLayoutContext';
import SmartLayoutSection from '../Library/SmartLayout/SmartLayoutSection';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface MobileLibrarySheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileLibrarySheet: React.FC<MobileLibrarySheetProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'frames' | 'layout' | 'photos'>('frames');
    const [isEditMode, setIsEditMode] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showCommonDialog, setShowCommonDialog] = useState(false);

    const {
        currentProject,
        updateProject,
        selectedFrameIds,
        addToLibrary
    } = useProject();

    // View State (Mobile Specific)
    const [framesViewMode, setFramesViewMode] = useLocalStorage<'list' | 'grid'>('mobile_library_frames_view_mode', 'grid');
    const [photosViewMode, setPhotosViewMode] = useLocalStorage<'list' | 'grid'>('mobile_library_photos_view_mode', 'grid');
    const [photosZoomLevel, setPhotosZoomLevel] = useLocalStorage<'small' | 'medium' | 'large' | 'xlarge'>('mobile_library_photos_zoom_level', 'medium');

    const viewport = useViewport();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Swipe Dismiss
    const { handlers, swipeStyle, triggerDismiss } = useSwipeDismiss({
        onDismiss: onClose,
        scrollRef,
        isOpen
    });

    if (!isOpen || !currentProject) return null;

    // -- Handlers --

    const handleAddCustomFrame = (width: number, height: number, shape: 'rect' | 'round', matted: boolean, borderWidth: number) => {
        // Create manual frame template
        const template: Frame = {
            id: 'manual_' + uuidv4(),
            width,
            height,
            label: `Custom ${width}" x ${height}"`,
            shape,
            frameColor: '#111111',
            matted: matted ? { width: width - 2, height: height - 2 } : undefined, // Default logic
            borderWidth: borderWidth,
            x: 0,
            y: 0,
            rotation: 0,
            zIndex: 0
        };

        handleAddFrame(template);
        setShowAddDialog(false);
    };

    const handleAddCommonFrame = (width: number, height: number, label: string) => {
        const frame = {
            id: uuidv4(),
            width,
            height,
            label: `Common ${label}`,
            shape: 'rect',
            frameColor: '#111111',
            matted: undefined,
            borderWidth: 1.0,
            x: 0,
            y: 0,
            rotation: 0,
            zIndex: 0
        };

        addToLibrary(currentProject.id, frame);
        setShowCommonDialog(false);
    };

    const handleAddFrame = (template: Frame) => {
        // Smart Navigation: If frame is already placed, find it and zoom to it
        const existingFrame = currentProject.frames.find(f => f.templateId === template.id);

        if (existingFrame && viewport) {
            // Calculate center of frame on canvas
            const CANVAS_PPI = 10;
            const frameCX = existingFrame.x + (existingFrame.width * CANVAS_PPI) / 2;
            const frameCY = existingFrame.y + (existingFrame.height * CANVAS_PPI) / 2;

            // Goal: Center this point on screen
            // screenX = canvasX * scale + panX
            // panX = screenX - canvasX * scale

            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // Zoom in a bit if we're too far out, or keep current if already close
            const targetScale = Math.max(viewport.scale, 0.75);

            const newPanX = (winW / 2) - (frameCX * targetScale);
            const newPanY = (winH / 2) - (frameCY * targetScale);

            viewport.setScale(targetScale);
            viewport.setPan({ x: newPanX, y: newPanY });

            onClose();
            return;
        }

        const id = uuidv4();
        const frames = currentProject.frames;

        // Frame dimensions (in whatever unit the coordinate system uses)
        const frameW = template.width;
        const frameH = template.height;

        let x = 5;
        let y = 5;

        // Strategy 1: Place at CENTER OF VIEWPORT (where user is looking)
        if (viewport && viewport.pan && viewport.scale) {
            const { pan, scale } = viewport;
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // Convert screen center to canvas coordinates
            // Screen formula: screenX = canvasX * scale + pan.x
            // Inverse: canvasX = (screenX - pan.x) / scale
            const viewportCenterScreenX = winW / 2;
            const viewportCenterScreenY = winH / 2;

            // Convert to canvas coordinates (same units as frame x/y)
            const canvasCenterX = (viewportCenterScreenX - pan.x) / scale;
            const canvasCenterY = (viewportCenterScreenY - pan.y) / scale;

            // Center the new frame at this position
            // Canvas uses ~10 pixels per inch, frame dimensions are in inches
            const CANVAS_PPI = 10;
            x = canvasCenterX - (frameW * CANVAS_PPI) / 2;
            y = canvasCenterY - (frameH * CANVAS_PPI) / 2;
        }
        // Strategy 2: Fallback - Place near existing content
        else if (frames.length > 0) {
            const maxXAnchor = Math.max(...frames.map(f => f.x));
            const minYAnchor = Math.min(...frames.map(f => f.y));
            const rightmostFrame = frames.reduce((prev, curr) => curr.x > prev.x ? curr : prev);

            const offset = (frames.length % 5) * 10;
            x = maxXAnchor + rightmostFrame.width + 2 + offset;
            y = minYAnchor + offset;

            const wallW = currentProject.wallConfig.width;
            const wallH = currentProject.wallConfig.height;
            if (x + frameW > wallW) {
                const minXAnchor = Math.min(...frames.map(f => f.x));
                const maxYAnchor = Math.max(...frames.map(f => f.y));
                const bottomFrame = frames.reduce((prev, curr) => curr.y > prev.y ? curr : prev);

                x = minXAnchor + offset;
                y = maxYAnchor + bottomFrame.height + 2 + offset;

                if (y + frameH > wallH) {
                    x = 5 + offset;
                    y = 5 + offset;
                }
            }
        }

        // Create frame with templateId linking back to library template
        const newFrame: Frame = {
            id,
            templateId: template.id.startsWith('manual_') ? undefined : template.id,
            width: template.width,
            height: template.height,
            label: template.label,
            shape: template.shape || 'rect',
            frameColor: template.frameColor || '#111111',
            matted: template.matted,
            borderWidth: template.borderWidth,
            x: x,
            y: y,
            rotation: 0,
            zIndex: Math.max(0, ...frames.map(f => f.zIndex || 0)) + 1,  // On top of all existing frames
            imageId: null,
            imageState: null
        };

        // Add to project
        updateProject(currentProject.id, {
            frames: [...currentProject.frames, newFrame]
        });

        // Close sheet
        onClose();
    };

    const handleAddPhoto = (imageId: string) => {
        // Strict workflow: Must have frame selected
        if (selectedFrameIds.length === 0) {
            alert("Please select a frame on the wall first.");
            return;
        }

        // Apply to all selected frames
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                return { ...f, imageId };
            }
            return f;
        });

        updateProject(currentProject.id, {
            frames: updatedFrames
        });

        onClose();
    };

    return (
        <SmartLayoutProvider>
            <div className={styles.sheetOverlay} onClick={triggerDismiss}>
                <div
                    className={styles.sheetContent}
                    onClick={e => e.stopPropagation()}
                    style={swipeStyle}
                    {...handlers}
                >
                    {/* Handle Bar (Visual only now) */}
                    <div className={styles.handleBar}>
                        <div className={styles.handle} />
                    </div>

                    <div className={styles.header}>
                        <div className={styles.tabs} style={{ gap: '20px' }}>
                            <button
                                className={`${styles.tab} ${activeTab === 'frames' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('frames')}
                            >
                                Frames
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'layout' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('layout')}
                            >
                                Layout
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'photos' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('photos')}
                            >
                                Photos
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {/* Manage Button - Hide on Layout Tab */}
                            {activeTab !== 'layout' && (
                                <button
                                    className={`${styles.editBtn} ${isEditMode ? styles.editActive : ''}`}
                                    onClick={() => setIsEditMode(!isEditMode)}
                                >
                                    {isEditMode ? 'Done' : 'Manage'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.scrollArea} ref={scrollRef}>
                        {activeTab === 'frames' && (
                            <>
                                <FrameList
                                    onFrameSelect={!isEditMode ? handleAddFrame : undefined}
                                    selectionMode={isEditMode ? 'toggle' : 'standard'}
                                    viewMode={framesViewMode}
                                    onViewModeChange={setFramesViewMode}
                                    headerAction={!isEditMode && (
                                        <div className={styles.addFrameActions}>
                                            <button
                                                className={styles.addFrameBtn}
                                                onClick={() => setShowCommonDialog(true)}
                                            >
                                                + Common
                                            </button>
                                            <button
                                                className={`${styles.addFrameBtn} ${styles.addCustomBtn}`}
                                                onClick={() => setShowAddDialog(true)}
                                            >
                                                + Custom
                                            </button>
                                        </div>
                                    )}
                                />
                            </>
                        )}
                        {activeTab === 'layout' && (
                            <div style={{ padding: '0 10px' }}>
                                <SmartLayoutSection maxSolutions={4} onComplete={onClose} isMobile={true} />
                            </div>
                        )}
                        {activeTab === 'photos' && (
                            <PhotoLibrary
                                onPhotoSelect={!isEditMode ? handleAddPhoto : undefined}
                                selectionMode={isEditMode ? 'toggle' : 'standard'}
                                viewMode={photosViewMode}
                                onViewModeChange={setPhotosViewMode}
                                zoomLevel={photosZoomLevel}
                                onZoomLevelChange={setPhotosZoomLevel}
                                isMobile={true}
                            />
                        )}
                    </div>
                </div>

                {showAddDialog && (
                    <MobileAddFrameDialog
                        onClose={() => setShowAddDialog(false)}
                        onAdd={handleAddCustomFrame}
                    />
                )}

                {showCommonDialog && (
                    <MobileCommonFrameDialog
                        onClose={() => setShowCommonDialog(false)}
                        onAdd={handleAddCommonFrame}
                    />
                )}
            </div>
        </SmartLayoutProvider>
    );
};

export default MobileLibrarySheet;
