import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../hooks/useProject';
import styles from './CanvasWorkspace.module.css';
import { v4 as uuidv4 } from 'uuid';
import { PPI, GRID_SIZE } from '../../constants';
import FrameContent from './FrameContent';
import ContextMenu from './ContextMenu';

// Hooks
import { useCanvasViewport } from '../../hooks/useCanvasViewport';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { useCanvasShortcuts } from '../../hooks/useCanvasShortcuts';

import { useLayout } from '../../hooks/useLayout';
import { Frame, LibraryItem } from '../../types';

const CanvasWorkspace: React.FC = () => {
    const { currentProject, updateProject, selectFrame, selectedFrameIds, setSelection, addImageToLibrary, undo, redo, focusedArea, setFocusedArea, setSelectedImages } = useProject();
    const containerRef = useRef<HTMLDivElement>(null);

    // Layout Context for stationary canvas
    const { isLeftSidebarOpen, sidebarWidth } = useLayout();

    // Grid State
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);

    // Viewport Hook
    const { scale, setScale, pan, setPan } = useCanvasViewport(containerRef);

    // Track last fitted project ID
    const lastFittedProjectId = useRef<string | null>(null);

    // Track previous sidebar width for compensation (on both toggle and resize)
    const prevSidebarWidth = useRef(isLeftSidebarOpen ? sidebarWidth : 0);

    // Counter-act sidebar movement (both toggle and resize)
    React.useLayoutEffect(() => {
        const currentEffectiveWidth = isLeftSidebarOpen ? sidebarWidth : 0;
        const previousWidth = prevSidebarWidth.current;

        if (currentEffectiveWidth !== previousWidth) {
            const delta = currentEffectiveWidth - previousWidth;
            setPan(p => ({ ...p, x: p.x - delta }));
            prevSidebarWidth.current = currentEffectiveWidth;
        }
    }, [isLeftSidebarOpen, sidebarWidth, setPan]);

    // Helper to calculate Fit scale and pan
    const calculateFitViewport = () => {
        if (!containerRef.current || !currentProject?.wallConfig) return null;

        const container = containerRef.current.getBoundingClientRect();
        const wallW = currentProject.wallConfig.width * PPI;
        const wallH = currentProject.wallConfig.height * PPI;

        const padding = 80;
        const availW = container.width - padding * 2;
        const availH = container.height - padding * 2;

        if (availW <= 0 || availH <= 0) return null;

        const scaleX = availW / wallW;
        const scaleY = availH / wallH;
        const finalScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 5);

        const scaledW = wallW * finalScale;
        const scaledH = wallH * finalScale;
        const x = (container.width - scaledW) / 2;
        const y = (container.height - scaledH) / 2;

        return { scale: finalScale, pan: { x, y } };
    };

    // AUTO-ZOOM ON PROJECT SWITCH OR LOAD
    useEffect(() => {
        if (containerRef.current && currentProject?.id) {
            if (lastFittedProjectId.current !== currentProject.id) {
                const fit = calculateFitViewport();
                if (fit) {
                    setScale(fit.scale);
                    setPan(fit.pan);
                    lastFittedProjectId.current = currentProject.id;
                }
            }
        }
    }, [currentProject?.id, setScale, setPan]);

    // Helper: Snap
    const snap = (val: number) => {
        if (!snapToGrid) return val;
        const snapPx = Number(GRID_SIZE) * PPI;
        return Math.round(val / snapPx) * snapPx;
    };

    // Actions
    const duplicateSelected = React.useCallback(() => {
        if (!currentProject || selectedFrameIds.length === 0) return;
        const newFrames: Frame[] = [];
        const newLibraryItems: LibraryItem[] = [];
        const newSelectedIds: string[] = [];

        currentProject.frames.forEach(f => {
            if (selectedFrameIds.includes(f.id)) {
                const newId = uuidv4();
                const newTemplateId = uuidv4();
                const originalTemplate = currentProject.library.find(t => t.id === f.templateId);
                const templateToUse = originalTemplate || {
                    id: newTemplateId,
                    width: f.width,
                    height: f.height,
                    x: 0, y: 0,
                    rotation: 0,
                    zIndex: 0,
                    label: f.label || '',
                    shape: f.shape || 'rect',
                    createdAt: Date.now()
                };

                newLibraryItems.push({
                    ...templateToUse,
                    id: newTemplateId,
                    isDuplicate: true,
                    count: 1
                } as LibraryItem);

                newFrames.push({
                    ...f,
                    id: newId,
                    templateId: newTemplateId,
                    zIndex: Math.max(0, ...currentProject.frames.map(fr => fr.zIndex || 0)) + newFrames.length + 1
                });
                newSelectedIds.push(newId);
            }
        });

        if (newFrames.length > 0) {
            updateProject(currentProject.id, {
                frames: [...currentProject.frames, ...newFrames],
                library: [...currentProject.library, ...newLibraryItems]
            });
            setSelection(newSelectedIds);
        }
    }, [currentProject, selectedFrameIds, updateProject, setSelection]);

    const handleDeleteFrame = React.useCallback((frameIdOrIds: string | string[]) => {
        if (!currentProject) return;
        const idsToDelete = Array.isArray(frameIdOrIds) ? frameIdOrIds : [frameIdOrIds];
        const idSet = new Set(idsToDelete);
        const updatedFrames = currentProject.frames.filter(f => !idSet.has(f.id));
        updateProject(currentProject.id, { frames: updatedFrames });
        setSelection(selectedFrameIds.filter(id => !idSet.has(id)));
    }, [currentProject, updateProject, selectedFrameIds, setSelection]);

    const handleBringToFront = (frameIdOrIds: string | string[]) => {
        if (!currentProject) return;
        const ids = Array.isArray(frameIdOrIds) ? frameIdOrIds : [frameIdOrIds];
        const idSet = new Set(ids);
        const maxZ = Math.max(0, ...currentProject.frames.map(f => f.zIndex || 0));
        const updatedFrames = currentProject.frames.map((f, i) =>
            idSet.has(f.id) ? { ...f, zIndex: maxZ + 1 + i } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleSendToBack = (frameIdOrIds: string | string[]) => {
        if (!currentProject) return;
        const ids = Array.isArray(frameIdOrIds) ? frameIdOrIds : [frameIdOrIds];
        const idSet = new Set(ids);
        const minZ = Math.min(1000, ...currentProject.frames.map(f => f.zIndex || 0));
        const updatedFrames = currentProject.frames.map((f, i) =>
            idSet.has(f.id) ? { ...f, zIndex: Math.max(0, minZ - 1 - i) } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleRemovePhoto = (frameIdOrIds: string | string[]) => {
        if (!currentProject) return;
        const ids = Array.isArray(frameIdOrIds) ? frameIdOrIds : [frameIdOrIds];
        const idSet = new Set(ids);
        const updatedFrames = currentProject.frames.map(f =>
            idSet.has(f.id) ? { ...f, imageId: null } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleRotatePhoto = (frameIdOrIds: string | string[]) => {
        if (!currentProject) return;
        const ids = Array.isArray(frameIdOrIds) ? frameIdOrIds : [frameIdOrIds];
        const idSet = new Set(ids);
        const updatedFrames = currentProject.frames.map(f => {
            if (idSet.has(f.id) && f.imageId) {
                const currentState = f.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
                return { ...f, imageState: { ...currentState, rotation: (currentState.rotation + 90) % 360 } };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    // 1:1 ZOOM - CENTERS THE WALL
    const handleZoomTo100 = () => {
        if (!containerRef.current || !currentProject?.wallConfig) return;

        const container = containerRef.current.getBoundingClientRect();
        const wallW = currentProject.wallConfig.width * PPI;
        const wallH = currentProject.wallConfig.height * PPI;

        // Center the wall at 100% scale
        const x = (container.width - wallW) / 2;
        const y = (container.height - wallH) / 2;

        setScale(1);
        setPan({ x, y });
    };

    // FIT ZOOM
    const handleZoomToFit = () => {
        const fit = calculateFitViewport();
        if (fit) {
            setScale(fit.scale);
            setPan(fit.pan);
        }
    };

    const {
        isMarquee,
        marqueeRect,
        candidateFrameIds,
        contextMenu,
        setContextMenu,
        isDraggingFrame,
        hasDragged,
        dragDelta,
        initialPositions,
        handleMouseDown,
        handleFrameMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleContextMenu,
        handleDrop,
        handleDragOver
    } = useCanvasInteraction({
        containerRef,
        scale,
        pan,
        setPan,
        currentProject,
        updateProject,
        selectedFrameIds,
        selectFrame,
        setSelection,
        snapToGrid,
        addImageToLibrary,
        setFocusedArea,
        frameSelector: styles.frame
    });

    useCanvasShortcuts({
        currentProject,
        selectedFrameIds,
        focusedArea: focusedArea || 'canvas',
        updateProject,
        setSelection,
        setSelectedImages,
        undo,
        redo,
        duplicateSelected,
        handleDeleteFrame,
        setSnapToGrid,
        setShowGrid
    });

    // Forceful Background Click Deselection
    const onContainerMouseDown = (e: React.MouseEvent) => {
        if (e.target === containerRef.current && e.button === 0) {
            setSelection([]);
            setContextMenu(null);
            setFocusedArea('canvas');
        }
        handleMouseDown(e);
    };

    const onContextMenuCapture = (e: React.MouseEvent) => {
        handleContextMenu(e);
        if (!e.defaultPrevented) e.preventDefault();
    };

    if (!currentProject) {
        return <div className={styles.emptyState}>
            Create or select a project
        </div>;
    }

    const getFrameStyle = (frame: Frame) => {
        const isDragging = isDraggingFrame && selectedFrameIds.includes(frame.id);

        let displayX = frame.x;
        let displayY = frame.y;

        if (isDragging && hasDragged && initialPositions[frame.id]) {
            displayX = snap(initialPositions[frame.id].x + dragDelta.x);
            displayY = snap(initialPositions[frame.id].y + dragDelta.y);
        }

        const widthPx = Math.round(frame.width * PPI);
        const heightPx = Math.round(frame.height * PPI);
        const bWidthInches = typeof frame.borderWidth === 'number' ? frame.borderWidth : 0.1;
        const bWidthPx = Math.round(bWidthInches * PPI);

        const leftPx = Math.round(displayX - bWidthPx);
        const topPx = Math.round(displayY - bWidthPx);

        return {
            position: 'absolute' as const,
            left: `${leftPx}px`,
            top: `${topPx}px`,
            width: `${widthPx + bWidthPx * 2}px`,
            height: `${heightPx + bWidthPx * 2}px`,
            zIndex: frame.zIndex,
            border: `${bWidthPx}px solid ${frame.frameColor || '#111'}`,
            backgroundColor: frame.imageId ? (frame.frameColor || '#111') : '#fff',
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'box-shadow 0.1s',
            borderRadius: frame.shape === 'round' ? '50%' : '0',
            boxSizing: 'border-box' as const,
            pointerEvents: 'auto' as const
        };
    };

    // GRID SIZE FOR WALL (uses CSS variable)
    const gridSizePx = Math.max(1, Number(GRID_SIZE) * PPI);

    return (
        <div
            ref={containerRef}
            className={styles.canvasContainer}
            onMouseDown={onContainerMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenuCapture={onContextMenuCapture}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
                cursor: (isMarquee || currentProject.frames.length === 0) ? 'default' : (selectedFrameIds.length > 0 ? 'grab' : 'default')
            } as React.CSSProperties}
        >
            <div
                className={styles.canvasContent}
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    width: '100%', height: '100%',
                    pointerEvents: 'none'
                }}
            >
                {/* Wall with Grid */}
                {currentProject.wallConfig && (() => {
                    const wallType = currentProject.wallConfig.type;
                    const stairAngle = currentProject.wallConfig.stairAngle ?? 50;

                    // Calculate clip-path for staircase walls
                    // The stairAngle/slope directly represents what % of wall height is clipped on one side
                    // e.g., 30 means 30% of wall height is clipped, 45 means 45%, etc.
                    let clipPath: string | undefined;

                    if (wallType === 'staircase-asc' || wallType === 'staircase-desc') {
                        // Clamp to valid range: 10-100% of wall height rise
                        const clipPercent = Math.min(100, Math.max(10, stairAngle));
                        const bottomPercent = 100 - clipPercent;

                        if (wallType === 'staircase-asc') {
                            // Left is full height (100%), right clips up
                            clipPath = `polygon(0 0, 100% 0, 100% ${bottomPercent}%, 0 100%)`;
                        } else {
                            // Right is full height (100%), left clips up  
                            clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 ${bottomPercent}%)`;
                        }
                    }

                    return (
                        <div
                            id="canvas-wall"
                            className={`${styles.wall} ${showGrid ? styles.grid : ''}`}
                            style={{
                                width: `${currentProject.wallConfig.width * PPI}px`,
                                height: `${currentProject.wallConfig.height * PPI}px`,
                                backgroundColor: currentProject.wallConfig.backgroundColor,
                                top: 0,
                                left: 0,
                                pointerEvents: 'auto',
                                '--grid-size': `${gridSizePx}px`,
                                clipPath
                            } as React.CSSProperties}
                        />
                    );
                })()}

                <div style={{ pointerEvents: 'none' }}>
                    {currentProject.frames.map(frame => {
                        const isSelected = selectedFrameIds.includes(frame.id);
                        const isCandidate = candidateFrameIds.includes(frame.id);
                        return (
                            <div
                                key={frame.id}
                                className={`${styles.frame} ${isSelected ? styles.selected : ''} ${isCandidate ? styles.candidate : ''}`}
                                data-frame-id={frame.id}
                                style={getFrameStyle(frame)}
                                onMouseDown={(e) => handleFrameMouseDown(e, frame)}
                            >
                                <FrameContent frame={frame} ppi={PPI} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Marquee - rendered outside transformed div */}
            {isMarquee && marqueeRect && (
                <div
                    className={styles.marquee}
                    style={{
                        position: 'fixed',
                        left: Math.min(marqueeRect.x1, marqueeRect.x2),
                        top: Math.min(marqueeRect.y1, marqueeRect.y2),
                        width: Math.abs(marqueeRect.x2 - marqueeRect.x1),
                        height: Math.abs(marqueeRect.y2 - marqueeRect.y1),
                        border: '1px solid #2196f3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        pointerEvents: 'none',
                        zIndex: 9999
                    }}
                />
            )}

            {/* HUD with event isolation */}
            <div
                className={styles.hud}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => { e.stopPropagation(); e.preventDefault(); }}
            >
                <button onClick={() => setScale(s => Math.max(0.1, Math.round((s - 0.1) * 10) / 10))} title="Zoom Out">-</button>
                <span>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(5, Math.round((s + 0.1) * 10) / 10))} title="Zoom In">+</button>
                <div className={styles.separator} />
                <button onClick={(e) => { e.stopPropagation(); handleZoomTo100(); }} title="Zoom to 100%">1:1</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomToFit(); }} title="Zoom to Fit">Fit</button>
                <div className={styles.separator} />
                <button
                    onClick={() => setShowGrid(s => !s)}
                    className={showGrid ? styles.active : ''}
                    title="Toggle Grid"
                >
                    #
                </button>
                <button
                    onClick={() => setSnapToGrid(s => !s)}
                    className={snapToGrid ? styles.active : ''}
                    title="Toggle Snap"
                >
                    S
                </button>
            </div>

            {contextMenu && (() => {
                // Determine which frames to act on: if right-clicked frame is selected, use all selected; otherwise just the clicked frame
                const isClickedInSelection = selectedFrameIds.includes(contextMenu.frameId);
                const targetIds = isClickedInSelection ? selectedFrameIds : [contextMenu.frameId];
                const count = targetIds.length;
                const plural = count > 1;

                // Check if any target frames have photos
                const targetFrames = currentProject?.frames.filter(f => targetIds.includes(f.id)) || [];
                const hasAnyPhotos = targetFrames.some(f => f.imageId);

                return (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        items={[
                            { label: plural ? `Bring ${count} to Front` : 'Bring to Front', onClick: () => handleBringToFront(targetIds) },
                            { label: plural ? `Send ${count} to Back` : 'Send to Back', onClick: () => handleSendToBack(targetIds) },
                            { separator: true },
                            { label: plural ? `Duplicate ${count} Frames` : 'Duplicate', shortcut: plural ? undefined : 'Ctrl+D', onClick: duplicateSelected },
                            ...(hasAnyPhotos ? [
                                { label: plural ? `Rotate ${count} Photos 90°` : 'Rotate Photo 90°', onClick: () => handleRotatePhoto(targetIds) },
                                { label: plural ? `Remove ${count} Photos` : 'Remove Photo', onClick: () => handleRemovePhoto(targetIds) }
                            ] : []),
                            { label: plural ? `Delete ${count} Frames` : 'Delete', shortcut: plural ? undefined : 'Del', danger: true, onClick: () => handleDeleteFrame(targetIds) }
                        ]}
                    />
                );
            })()}
        </div>
    );
};

export default CanvasWorkspace;
