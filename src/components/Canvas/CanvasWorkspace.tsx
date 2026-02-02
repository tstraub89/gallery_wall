import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../hooks/useProject';
import styles from './CanvasWorkspace.module.css';
import { v4 as uuidv4 } from 'uuid';
import { PPI, GRID_SIZE } from '../../constants';
import FrameContent from './FrameContent';
import ContextMenu from './ContextMenu';
import Logo from '../Header/Logo';

// Hooks
import { useCanvasViewport } from '../../hooks/useCanvasViewport';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { useCanvasShortcuts } from '../../hooks/useCanvasShortcuts';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useTouchGestures } from '../../hooks/useTouchGestures';

import { useLayout } from '../../hooks/useLayout';
import { Frame, LibraryItem } from '../../types';
import { preloadImages } from '../../utils/imageStore';

const CanvasWorkspace: React.FC = () => {
    const { currentProject, updateProject, selectFrame, selectedFrameIds, setSelection, addImageToLibrary, undo, redo, focusedArea, setFocusedArea, setSelectedImages } = useProject();
    const containerRef = useRef<HTMLDivElement>(null);

    // Layout Context for stationary canvas
    const { isLeftSidebarOpen, sidebarWidth } = useLayout();
    const isMobile = useIsMobile();

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

        // Mobile uses smaller padding (16px) vs Desktop (80px)
        const padding = isMobile ? 16 : 80;
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




    // Derived state for synchronous blocking
    // If loadedProjectId !== currentProject.id, we are switching
    const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
    const isSwitching = loadedProjectId !== currentProject?.id;

    // AUTO-ZOOM ON PROJECT SWITCH OR LOAD
    useEffect(() => {
        if (!containerRef.current || !currentProject?.id) return;

        // Only fit viewport if we haven't fitted this project yet
        if (lastFittedProjectId.current !== currentProject.id) {
            const fit = calculateFitViewport();
            if (fit) {
                setScale(fit.scale);
                setPan(fit.pan);
                lastFittedProjectId.current = currentProject.id;
            }
        }
    }, [currentProject?.id, setScale, setPan]);

    // Handle project switching - Preload and Wait
    useEffect(() => {
        if (!currentProject?.id) return;

        const projectId = currentProject.id;

        // If we're already loaded on this project, do nothing
        if (loadedProjectId === projectId) return;

        // We are officially switching. Preload images.
        const imageIds = currentProject.frames
            .map(f => f.imageId)
            .filter((id): id is string => !!id);

        const minDelay = new Promise(resolve => setTimeout(resolve, 500));
        const preload = imageIds.length > 0 ? preloadImages(imageIds) : Promise.resolve();

        Promise.all([minDelay, preload]).then(() => {
            // Only update loaded state if we're still on the same project
            if (currentProject.id === projectId) {
                setLoadedProjectId(projectId);
            }
        });
    }, [currentProject?.id, currentProject?.frames, loadedProjectId]);

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

        // Filter out locked frames
        const allowedIds = idsToDelete.filter(id => {
            const f = currentProject.frames.find(fr => fr.id === id);
            return f && !f.locked;
        });

        if (allowedIds.length === 0) return; // Nothing to delete

        const idSet = new Set(allowedIds);
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

    // Drag Snapshot for Robust Snapping
    const dragStartSnapshot = useRef<Record<string, { x: number, y: number }>>({});
    // Track if we've pushed the "Undo" state for the current drag operation
    const hasCommittedDragHistory = useRef(false);

    // Touch Interactions
    useTouchGestures({
        containerRef,
        scale,
        setScale,
        pan,
        setPan,
        isFrameSelected: (target) => {
            if (!target) return false;
            // Need to cast to HTMLElement to check dataset or closest
            const el = target as HTMLElement;
            const frameEl = el.closest(`.${styles.frame}`);
            if (frameEl) {
                const id = frameEl.getAttribute('data-frame-id');
                // It is a frame. Is it selected?
                if (id && selectedFrameIds.includes(id)) {
                    // CRITICAL: If locked, treat as background (return false)
                    // This prevents Drag mode, falls back to Pan mode
                    const frame = currentProject?.frames.find(f => f.id === id);
                    if (frame?.locked) return false;

                    return true;
                }
            }
            return false;
        },
        onFrameDrag: (totalDx, totalDy) => {
            // Lazy init snapshot if empty (start of drag)
            if (Object.keys(dragStartSnapshot.current).length === 0 && currentProject && selectedFrameIds.length > 0) {
                selectedFrameIds.forEach(id => {
                    const f = currentProject.frames.find(fr => fr.id === id);
                    if (f) dragStartSnapshot.current[id] = { x: f.x, y: f.y };
                });
                // New drag started, ensure we haven't committed history yet
                hasCommittedDragHistory.current = false;
            }

            // Convert screen total delta to world total delta
            const worldDx = totalDx / scale;
            const worldDy = totalDy / scale;

            if (!currentProject) return;

            let didSnapMove = false;

            const updatedFrames = currentProject.frames.map(f => {
                if (selectedFrameIds.includes(f.id) && dragStartSnapshot.current[f.id]) {
                    const start = dragStartSnapshot.current[f.id];
                    // Calculate from START position + Total Delta, then Snap
                    const newX = snap(start.x + worldDx);
                    const newY = snap(start.y + worldDy);

                    // Check if we moved to a new snap position
                    if (Math.abs(newX - f.x) > 0.1 || Math.abs(newY - f.y) > 0.1) {
                        didSnapMove = true;
                    }

                    return { ...f, x: newX, y: newY };
                }
                return f;
            });

            // Haptic Feedback for Grid Snap
            if (didSnapMove && navigator.vibrate && snapToGrid) {
                navigator.vibrate(5); // Very short tick
            }

            // Updating project on every move is heavy but ensures reactivity.
            // HISTORY FIX: We only want to push to history on the FIRST move of a drag.
            // Subsequent moves should skip history to avoid flooding the stack.
            const shouldSkipHistory = hasCommittedDragHistory.current;

            updateProject(currentProject.id, { frames: updatedFrames }, shouldSkipHistory);

            if (!hasCommittedDragHistory.current) {
                hasCommittedDragHistory.current = true;
            }
        },
        onFrameDragEnd: () => {
            dragStartSnapshot.current = {};
            hasCommittedDragHistory.current = false;
        },
        onTap: (e) => {
            setContextMenu(null); // ALWAYS dismiss context menu
            dragStartSnapshot.current = {}; // Cleanup
            hasCommittedDragHistory.current = false;

            // Check if we tapped a frame
            const target = e.target as HTMLElement;
            const frameEl = target.closest(`.${styles.frame}`);
            if (frameEl) {
                const frameId = frameEl.getAttribute('data-frame-id');
                if (frameId) {
                    selectFrame(frameId, false);
                    return;
                }
            }
            // Background tap -> Deselect
            setSelection([]);
            setFocusedArea('canvas');
        },
        onLongPress: (e) => {
            // Trigger Context Menu
            // Note: useTouchGestures passes the original TouchEvent
            const t = e.touches[0];
            const target = e.target as HTMLElement;
            const frameEl = target.closest(`.${styles.frame}`);
            const frameId = frameEl ? frameEl.getAttribute('data-frame-id') : null;

            // Artificial Context Menu trigger
            if (frameId) {
                if (!selectedFrameIds.includes(frameId)) selectFrame(frameId, false);
                setContextMenu({ x: t.clientX, y: t.clientY, frameId });

                // Haptic feedback if available
                if (navigator.vibrate) navigator.vibrate(50);
            }
        },
        onDoubleTap: (e) => {
            // Reset state just in case
            dragStartSnapshot.current = {};
            hasCommittedDragHistory.current = false;

            const target = e.target as HTMLElement;
            const frameEl = target.closest(`.${styles.frame}`);

            if (frameEl && frameEl instanceof HTMLElement) {
                const frameId = frameEl.getAttribute('data-frame-id');
                const frame = currentProject?.frames.find(f => f.id === frameId);
                if (frame) {
                    // Zoom to frame
                    if (!containerRef.current) return;
                    const container = containerRef.current.getBoundingClientRect();
                    const frameW = frame.width * PPI;
                    const frameH = frame.height * PPI;

                    // Target scale to fit frame with padding (approx 60% of screen)
                    const scaleX = (container.width * 0.6) / frameW;
                    const scaleY = (container.height * 0.6) / frameH;
                    const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.5), 3);

                    // Center point in World coords
                    const cx = frame.x + frameW / 2;
                    const cy = frame.y + frameH / 2;

                    // Calculate Pan to center this point
                    const newPanX = (container.width / 2) - (cx * targetScale);
                    const newPanY = (container.height / 2) - (cy * targetScale);

                    setScale(targetScale);
                    setPan({ x: newPanX, y: newPanY });
                    return;
                }
            }

            // Background Double Tap -> Toggle Fit/100%
            const fit = calculateFitViewport();
            if (fit) {
                // If scale is close to Fit, go to 100%. Otherwise go to Fit.
                if (Math.abs(scale - fit.scale) < 0.1) {
                    handleZoomTo100();
                } else {
                    handleZoomToFit();
                }
            }
        }
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
        const bWidthInches = typeof frame.borderWidth === 'number' ? frame.borderWidth : 1.0;
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
                {/* Artboard Wrapper for Export */}
                <div
                    style={{
                        position: 'relative',
                        width: `${currentProject.wallConfig.width * PPI}px`,
                        height: `${currentProject.wallConfig.height * PPI}px`,
                    }}
                >
                    {/* Wall with Grid */}
                    {currentProject.wallConfig && (() => {
                        const wallType = currentProject.wallConfig.type;
                        const stairAngle = currentProject.wallConfig.stairAngle ?? 50;

                        // Calculate clip-path for staircase walls
                        let clipPath: string | undefined;

                        if (wallType === 'staircase-asc' || wallType === 'staircase-desc') {
                            const clipPercent = Math.min(100, Math.max(10, stairAngle));
                            const bottomPercent = 100 - clipPercent;

                            if (wallType === 'staircase-asc') {
                                clipPath = `polygon(0 0, 100% 0, 100% ${bottomPercent}%, 0 100%)`;
                            } else {
                                clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 ${bottomPercent}%)`;
                            }
                        }

                        return (
                            <div
                                id="canvas-wall"
                                className={`${styles.wall} ${showGrid ? styles.grid : ''}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: currentProject.wallConfig.backgroundColor,
                                    // Override styled component top/left to fit wrapper
                                    top: 0,
                                    left: 0,
                                    pointerEvents: 'auto',
                                    '--grid-size': `${gridSizePx}px`,
                                    clipPath
                                } as React.CSSProperties}
                            />
                        );
                    })()}

                    <div style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        {currentProject.frames.map(frame => {
                            const isSelected = selectedFrameIds.includes(frame.id);
                            const isCandidate = candidateFrameIds.includes(frame.id);
                            return (
                                <div
                                    key={frame.id}
                                    className={`${styles.frame} ${isSelected ? styles.selected : ''} ${isCandidate ? styles.candidate : ''}`}
                                    data-frame-id={frame.id}
                                    style={getFrameStyle(frame)}
                                    // Keep drag handlers for the interactive view
                                    onMouseDown={(e) => handleFrameMouseDown(e, frame)}
                                >
                                    <FrameContent frame={frame} ppi={PPI} />
                                    {frame.locked && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-10px',
                                            right: '-10px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 9999,
                                            pointerEvents: 'none'
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* HIDDEN EXPORT CONTAINER - Fixed 1:1 Scale */}
            {/* Placed behind the main canvas background (z-index: -5) so it's "on screen" but hidden */}
            {/* This ensures mobile browsers (Chrome/Safari) don't cull it from painting */}
            <div
                id="canvas-export-target"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${currentProject.wallConfig.width * PPI}px`,
                    height: `${currentProject.wallConfig.height * PPI}px`,
                    visibility: 'visible',
                    pointerEvents: 'none',
                    zIndex: -5,
                    overflow: 'hidden' // Just in case
                }}
            >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Plain Wall */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%', height: '100%',
                            backgroundColor: currentProject.wallConfig.backgroundColor,
                            clipPath: (() => {
                                const wallType = currentProject.wallConfig.type;
                                const stairAngle = currentProject.wallConfig.stairAngle ?? 50;
                                if (wallType === 'staircase-asc' || wallType === 'staircase-desc') {
                                    const clipPercent = Math.min(100, Math.max(10, stairAngle));
                                    const bottomPercent = 100 - clipPercent;
                                    if (wallType === 'staircase-asc') return `polygon(0 0, 100% 0, 100% ${bottomPercent}%, 0 100%)`;
                                    else return `polygon(0 0, 100% 0, 100% 100%, 0 ${bottomPercent}%)`;
                                }
                                return undefined;
                            })()
                        }}
                    />
                    {/* Render Frames Plainly (using same getFrameStyle but forcing no interactive states if desired, 
                        actually we want same look so let's reuse getFrameStyle but override position to be pure relative to 0,0) */}
                    {currentProject.frames.map(frame => {
                        const style = getFrameStyle(frame);
                        // Remove transition for export
                        return (
                            <div
                                key={frame.id}
                                className={styles.frame}
                                style={{
                                    ...style,
                                    transition: 'none',
                                    cursor: 'default',
                                    boxShadow: '1px 1px 3px rgba(0,0,0,0.4)', // Force standard shadow, no selection glow
                                    // Ensure coordinates are correct (they are absolute in getFrameStyle based on frame.x/y)
                                    // But getFrameStyle adds dragDelta... we DON'T want drag delta in export if currently dragging?
                                    // Actually we probably do want "what you see", but "what you see" includes drag.
                                    // Ideally export snapshots the committed state. Let's use clean frame.x/y
                                    left: `${Math.round(frame.x - (typeof frame.borderWidth === 'number' ? frame.borderWidth : 0.1) * PPI)}px`,
                                    top: `${Math.round(frame.y - (typeof frame.borderWidth === 'number' ? frame.borderWidth : 0.1) * PPI)}px`,
                                }}
                            >
                                <FrameContent frame={frame} ppi={PPI} />
                            </div>
                        );
                    })}

                    {/* Watermark */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '16px',
                            right: '16px',
                            opacity: 0.9,
                            transform: 'scale(0.75)',
                            transformOrigin: 'bottom right',
                            pointerEvents: 'none',
                            zIndex: 9999, // On top
                            background: 'rgba(255, 255, 255, 0.85)',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        <Logo />
                    </div>
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
                            { separator: true },
                            // Lock/Unlock Logic
                            (() => {
                                const allLocked = targetFrames.every(f => f.locked);
                                return {
                                    label: allLocked ? (plural ? `Unlock ${count} Frames` : "Unlock Frame") : (plural ? `Lock ${count} Frames` : "Lock Frame"),
                                    onClick: () => {
                                        const newVal = !allLocked;
                                        // Update frames
                                        const updatedFrames = currentProject.frames.map(f =>
                                            targetIds.includes(f.id) ? { ...f, locked: newVal } : f
                                        );
                                        // Sync library
                                        const impactedTemplates = new Set(targetFrames.map(f => f.templateId).filter(Boolean));
                                        const updatedLibrary = currentProject.library.map(l =>
                                            impactedTemplates.has(l.id) ? { ...l, locked: newVal } : l
                                        );
                                        updateProject(currentProject.id, { frames: updatedFrames, library: updatedLibrary });
                                    }
                                };
                            })(),
                            { separator: true },
                            ...(hasAnyPhotos ? [
                                { label: plural ? `Rotate ${count} Photos 90°` : 'Rotate Photo 90°', onClick: () => handleRotatePhoto(targetIds) },
                                { label: plural ? `Remove ${count} Photos` : 'Remove Photo', onClick: () => handleRemovePhoto(targetIds) }
                            ] : []),
                            { label: plural ? `Delete ${count} Frames` : 'Delete', shortcut: plural ? undefined : 'Del', danger: true, onClick: () => handleDeleteFrame(targetIds) }
                        ]}
                    />
                );
            })()}


            <div className={`${styles.loadingOverlay} ${!isSwitching ? styles.hidden : ''}`}>
                <div className={styles.loadingSpinner}></div>
                <div className={styles.loadingText}>Loading project...</div>
            </div>
        </div>
    );
};

export default CanvasWorkspace;
