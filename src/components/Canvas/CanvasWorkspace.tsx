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
import { useCanvasSelection } from '../../hooks/useCanvasSelection';
import { useCanvasDrag } from '../../hooks/useCanvasDrag';
import { useCanvasDrop } from '../../hooks/useCanvasDrop';
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

    // Track touch drag delta locally to avoid global re-renders
    const [touchDragDelta, setTouchDragDelta] = useState({ x: 0, y: 0 });
    const dragStartSnapshot = useRef<Record<string, { x: number, y: number }>>({});

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, frameId: string } | null>(null);
    const hasPannedRef = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

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

    // --- Interaction Hooks ---

    const selection = useCanvasSelection({
        containerRef,
        scale,
        pan,
        currentProject,
        selectedFrameIds,
        setSelection,
        setFocusedArea,
        frameSelector: styles.frame
    });

    const drag = useCanvasDrag({
        scale,
        currentProject,
        selectedFrameIds,
        selectFrame,
        setSelection,
        updateProject,
        setFocusedArea,
        frameSelector: styles.frame
    });

    const drop = useCanvasDrop({
        containerRef,
        scale,
        pan,
        currentProject,
        updateProject,
        addImageToLibrary,
        frameSelector: styles.frame
    });

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        // If we panned, we do NOT show the context menu
        if (hasPannedRef.current) return;

        const tempTarget = e.target as HTMLElement;
        const frameEl = tempTarget.closest(`.${styles.frame}`);
        const frameId = frameEl ? frameEl.getAttribute('data-frame-id') : null;
        if (frameId) {
            if (!selectedFrameIds.includes(frameId)) selectFrame(frameId, false);
            setContextMenu({ x: e.clientX, y: e.clientY, frameId });
        } else {
            setContextMenu(null);
        }
    };

    // Pan Handlers (Merged here as lightweight)
    const handlePanMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || e.button === 2) {
            setIsPanning(true);
            lastMouse.current = { x: e.clientX, y: e.clientY };
            hasPannedRef.current = false;
        }
    };

    const handlePanMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                hasPannedRef.current = true;
            }
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMouse.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handlePanMouseUp = () => {
        setIsPanning(false);
    };

    const onContainerMouseDown = (e: React.MouseEvent) => {
        setContextMenu(null);
        if (e.button === 1 || e.button === 2) {
            handlePanMouseDown(e);
            return;
        }

        // Route to Selection Hook
        selection.handleSelectionMouseDown(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handlePanMouseMove(e);
        selection.handleSelectionMouseMove(e);
        drag.handleDragMouseMove(e);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        handlePanMouseUp();
        selection.handleSelectionMouseUp(e);
        drag.handleDragMouseUp(e, snap); // Pass Snap
    };

    // --- Actions ---
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

    // --- Missing Handlers ---
    const handleZoomTo100 = () => {
        if (!containerRef.current || !currentProject?.wallConfig) return;
        const container = containerRef.current.getBoundingClientRect();
        const wallW = currentProject.wallConfig.width * PPI;
        const wallH = currentProject.wallConfig.height * PPI;
        const x = (container.width - wallW) / 2;
        const y = (container.height - wallH) / 2;
        setScale(1);
        setPan({ x, y });
    };

    const handleZoomToFit = () => {
        const fit = calculateFitViewport();
        if (fit) {
            setScale(fit.scale);
            setPan(fit.pan);
        }
    };

    const handleBringToFront = (frameId: string) => {
        if (!currentProject) return;
        const maxZ = Math.max(0, ...currentProject.frames.map(f => f.zIndex || 0));
        const updatedFrames = currentProject.frames.map(f =>
            f.id === frameId ? { ...f, zIndex: maxZ + 1 } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleSendToBack = (frameId: string) => {
        if (!currentProject) return;
        const minZ = Math.min(1000, ...currentProject.frames.map(f => f.zIndex || 0));
        const updatedFrames = currentProject.frames.map(f =>
            f.id === frameId ? { ...f, zIndex: Math.max(0, minZ - 1) } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleRemovePhoto = (frameId: string) => {
        if (!currentProject) return;
        const updatedFrames = currentProject.frames.map(f =>
            f.id === frameId ? { ...f, imageId: null, imageState: null } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleRotatePhoto = (frameId: string) => {
        if (!currentProject) return;
        const updatedFrames = currentProject.frames.map(f => {
            if (f.id === frameId && f.imageId) {
                const s = f.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
                return { ...f, imageState: { ...s, rotation: (s.rotation + 90) % 360 } };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

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
            }

            // Update LOCAL state for visual feedback (no global render)
            setTouchDragDelta({ x: totalDx / scale, y: totalDy / scale });
        },
        onFrameDragEnd: () => {
            if (!currentProject) return;

            // Commit final position
            const updatedFrames = currentProject.frames.map(f => {
                if (selectedFrameIds.includes(f.id) && dragStartSnapshot.current[f.id]) {
                    const start = dragStartSnapshot.current[f.id];
                    const { x: worldDx, y: worldDy } = touchDragDelta;

                    const newX = snap(start.x + worldDx);
                    const newY = snap(start.y + worldDy);

                    return { ...f, x: newX, y: newY };
                }
                return f;
            });

            updateProject(currentProject.id, { frames: updatedFrames });

            // Reset
            dragStartSnapshot.current = {};
            setTouchDragDelta({ x: 0, y: 0 });
        },
        onTap: (e) => {
            setContextMenu(null); // ALWAYS dismiss context menu
            dragStartSnapshot.current = {}; // Cleanup
            setTouchDragDelta({ x: 0, y: 0 });

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
            setTouchDragDelta({ x: 0, y: 0 });

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
        const isDragging = drag.isDraggingFrame && selectedFrameIds.includes(frame.id);
        const isTouchDragging = (touchDragDelta.x !== 0 || touchDragDelta.y !== 0) && selectedFrameIds.includes(frame.id);

        let displayX = frame.x;
        let displayY = frame.y;

        // Prioritize Touch Drag (Visual Feedback)
        if (isTouchDragging && dragStartSnapshot.current[frame.id]) {
            // Touch typically has simpler snap logic, but let's apply Group Snap here too if we want consistency
            // For now, keeping original touch snap logic (individual) or we can refactor touch to use bounds too.
            // User complained about Drag (Mouse), let's focus on that first or apply to both?
            // applying individual snap for touch might be inconsistent. 
            // Let's settle for individual snap on touch as it's separate hook/logic for now unless I rewrite touch too.
            displayX = snap(dragStartSnapshot.current[frame.id].x + touchDragDelta.x);
            displayY = snap(dragStartSnapshot.current[frame.id].y + touchDragDelta.y);
        }
        // Mouse Drag with GROUP SNAP
        else if (isDragging && drag.hasDragged && drag.initialPositions[frame.id] && drag.dragStartBounds) {
            // Calculate what the GROUP DELTA should be
            // 1. Where does the group origin want to go? 
            const targetOriginX = drag.dragStartBounds.minX + drag.dragDelta.x;
            const targetOriginY = drag.dragStartBounds.minY + drag.dragDelta.y;

            // 2. Snap that group origin
            const snappedOriginX = snap(targetOriginX);
            const snappedOriginY = snap(targetOriginY);

            // 3. Effective Group Delta
            const groupDx = snappedOriginX - drag.dragStartBounds.minX;
            const groupDy = snappedOriginY - drag.dragStartBounds.minY;

            // 4. Apply to this frame
            displayX = drag.initialPositions[frame.id].x + groupDx;
            displayY = drag.initialPositions[frame.id].y + groupDy;
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
            transition: (isDragging || isTouchDragging) ? 'none' : 'box-shadow 0.1s',
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
            onDragOver={drop.handleDragOver}
            onDrop={(e) => drop.handleDrop(e, snap)}
            style={{
                cursor: (selection.isMarquee || currentProject.frames.length === 0) ? 'default' : (selectedFrameIds.length > 0 ? 'grab' : 'default')
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
                            const isCandidate = selection.candidateFrameIds.includes(frame.id);
                            return (
                                <div
                                    key={frame.id}
                                    className={`${styles.frame} ${isSelected ? styles.selected : ''} ${isCandidate ? styles.candidate : ''}`}
                                    data-frame-id={frame.id}
                                    style={getFrameStyle(frame)}
                                    // Keep drag handlers for the interactive view
                                    onMouseDown={(e) => drag.handleFrameMouseDown(e, frame)}
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

            {/* HIDDEN EXPORT CONTAINER (Simplified for brevity, kept same logic) */}
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
                    overflow: 'hidden'
                }}
            >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
                    {currentProject.frames.map(frame => {
                        const style = getFrameStyle(frame);
                        // Clean style for export (no grab cursors etc)
                        return (
                            <div
                                key={frame.id}
                                className={styles.frame}
                                style={{
                                    ...style,
                                    transition: 'none',
                                    cursor: 'default',
                                    boxShadow: '1px 1px 3px rgba(0,0,0,0.4)',
                                    // Use original positions for export
                                    left: `${Math.round(frame.x - (typeof frame.borderWidth === 'number' ? frame.borderWidth : 0.1) * PPI)}px`,
                                    top: `${Math.round(frame.y - (typeof frame.borderWidth === 'number' ? frame.borderWidth : 0.1) * PPI)}px`,
                                }}
                            >
                                <FrameContent frame={frame} ppi={PPI} />
                            </div>
                        );
                    })}
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

            {/* Marquee - using Hook State */}
            {selection.isMarquee && selection.marqueeRect && (
                <div
                    className={styles.marquee}
                    style={{
                        position: 'fixed',
                        left: Math.min(selection.marqueeRect.x1, selection.marqueeRect.x2),
                        top: Math.min(selection.marqueeRect.y1, selection.marqueeRect.y2),
                        width: Math.abs(selection.marqueeRect.x2 - selection.marqueeRect.x1),
                        height: Math.abs(selection.marqueeRect.y2 - selection.marqueeRect.y1),
                        border: '1px solid #2196f3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        pointerEvents: 'none',
                        zIndex: 9999
                    }}
                />
            )}

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={[
                        { label: 'Bring to Front', onClick: () => handleBringToFront(contextMenu.frameId) },
                        { label: 'Send to Back', onClick: () => handleSendToBack(contextMenu.frameId) },
                        { separator: true },
                        { label: 'Rotate Photo', onClick: () => handleRotatePhoto(contextMenu.frameId) },
                        { label: 'Remove Photo', onClick: () => handleRemovePhoto(contextMenu.frameId), danger: true },
                        { separator: true },
                        { label: 'Duplicate', onClick: duplicateSelected, shortcut: 'Cmd+D' },
                        { label: 'Delete Frame', onClick: () => handleDeleteFrame(contextMenu.frameId), danger: true, shortcut: 'Del' }
                    ]}
                />
            )}

            {/* HUD */}
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
        </div>
    );
};

export default CanvasWorkspace;
