import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
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

const CanvasWorkspace = () => {
    const { currentProject, updateProject, selectFrame, selectedFrameIds, setSelection, addImageToLibrary, undo, redo, focusedArea, setFocusedArea, setSelectedImages } = useProject();
    const containerRef = useRef(null);

    // Layout Context for stationary canvas
    const { isLeftSidebarOpen, sidebarWidth } = useLayout();
    const prevIsLeftSidebarOpen = useRef(isLeftSidebarOpen);

    // Grid State
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);

    // Viewport Hook
    const { scale, setScale, pan, setPan } = useCanvasViewport(containerRef);

    // Counter-act sidebar movement
    React.useLayoutEffect(() => {
        if (prevIsLeftSidebarOpen.current !== isLeftSidebarOpen) {
            // Sidebar CHANGED
            if (isLeftSidebarOpen) {
                // Opening: Sidebar pushes content right, so we pan LEFT (-) to keep it in place visually
                setPan(p => ({ ...p, x: p.x - sidebarWidth }));
            } else {
                // Closing: Sidebar removal pulls content left, so we pan RIGHT (+)
                setPan(p => ({ ...p, x: p.x + sidebarWidth }));
            }
            prevIsLeftSidebarOpen.current = isLeftSidebarOpen;
        }
    }, [isLeftSidebarOpen, sidebarWidth, setPan]);

    // Helper: Snap (used for rendering visual feedback, passing to interactions handled inside hook but also here if needed?)
    // Actually interaction hook handles snapping for drag. logic duplicated? 
    // The renderer uses it for visual feedback of dragging?
    const snap = (val) => {
        if (!snapToGrid) return val;
        const snapPx = GRID_SIZE * PPI;
        return Math.round(val / snapPx) * snapPx;
    };

    // Actions (needed for Context Menu and Shortcuts)
    const duplicateSelected = React.useCallback(() => {
        if (selectedFrameIds.length === 0) return;
        const newFrames = [];
        const newLibraryItems = [];
        const newSelectedIds = [];

        currentProject.frames.forEach(f => {
            if (selectedFrameIds.includes(f.id)) {
                const newId = uuidv4();
                const newTemplateId = uuidv4();
                const originalTemplate = currentProject.library.find(t => t.id === f.templateId) || {};

                newLibraryItems.push({
                    ...originalTemplate,
                    id: newTemplateId,
                    isDuplicate: true,
                    count: 1
                });

                newFrames.push({
                    ...f,
                    id: newId,
                    templateId: newTemplateId,
                    x: f.x + 10,
                    y: f.y + 10,
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

    const handleDeleteFrame = React.useCallback((frameId) => {
        const ids = selectedFrameIds.includes(frameId) ? selectedFrameIds : [frameId];
        const updatedFrames = currentProject.frames.filter(f => !ids.includes(f.id));
        updateProject(currentProject.id, { frames: updatedFrames });
        setSelection([]);
    }, [currentProject, selectedFrameIds, updateProject, setSelection]);

    const handleBringToFront = (frameId) => {
        const ids = selectedFrameIds.includes(frameId) ? selectedFrameIds : [frameId];
        const maxZ = Math.max(0, ...currentProject.frames.map(f => f.zIndex || 0));
        const updatedFrames = currentProject.frames.map(f => ids.includes(f.id) ? { ...f, zIndex: maxZ + 1 } : f);
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleSendToBack = (frameId) => {
        const ids = selectedFrameIds.includes(frameId) ? selectedFrameIds : [frameId];
        const minZ = Math.min(1000, ...currentProject.frames.map(f => f.zIndex || 0));
        const updatedFrames = currentProject.frames.map(f => ids.includes(f.id) ? { ...f, zIndex: Math.max(0, minZ - 1) } : f);
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleRemovePhoto = (frameId) => {
        const ids = selectedFrameIds.includes(frameId) ? selectedFrameIds : [frameId];
        const updatedFrames = currentProject.frames.map(f => ids.includes(f.id) ? { ...f, imageId: null } : f);
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const handleResetImage = (frameId) => {
        const updatedFrames = currentProject.frames.map(f =>
            f.id === frameId ? { ...f, imageState: { scale: 1, x: 0, y: 0, rotation: 0 } } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    // Interaction Hook
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
        setFocusedArea
    });

    // Shortcuts Hook
    useCanvasShortcuts({
        currentProject,
        selectedFrameIds,
        focusedArea,
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

    if (!currentProject) {
        return <div className={styles.empty}>Select a project to start planning.</div>;
    }

    return (
        <div
            className={styles.container}
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onContextMenu={handleContextMenu}
        >
            <div className={styles.world} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}>
                <div id="canvas-wall" className={`${styles.wall} ${showGrid ? styles.grid : ''} ${styles[currentProject.wallConfig.type]}`} style={{ width: `${currentProject.wallConfig.width * PPI}px`, height: `${currentProject.wallConfig.height * PPI}px`, backgroundColor: currentProject.wallConfig.backgroundColor, '--grid-size': `${GRID_SIZE * PPI}px` }}>
                    {currentProject.frames.map(frame => {
                        const isDraggingThis = selectedFrameIds.includes(frame.id) && isDraggingFrame && hasDragged;
                        let displayX = frame.x, displayY = frame.y;
                        if (isDraggingThis) {
                            const initPos = initialPositions[frame.id];
                            if (initPos) {
                                displayX = snap(initPos.x + dragDelta.x);
                                displayY = snap(initPos.y + dragDelta.y);
                            }
                        }
                        const bWidthPx = (frame.borderWidth || 0.1) * PPI;
                        const isCandidate = candidateFrameIds.includes(frame.id) && !selectedFrameIds.includes(frame.id);
                        return (
                            <div
                                key={frame.id}
                                data-frame-id={frame.id}
                                className={`${styles.frame} ${selectedFrameIds.includes(frame.id) ? styles.selected : ''} ${isCandidate ? styles.candidate : ''}`}
                                onMouseDown={(e) => handleFrameMouseDown(e, frame)}
                                onDoubleClick={() => handleResetImage(frame.id)}
                                onDragStart={(e) => e.preventDefault()}
                                style={{
                                    left: `${displayX - bWidthPx}px`,
                                    top: `${displayY - bWidthPx}px`,
                                    width: `${frame.width * PPI}px`,
                                    height: `${frame.height * PPI}px`,
                                    transform: `rotate(${frame.rotation}deg)`,
                                    zIndex: frame.zIndex,
                                    userSelect: 'none',
                                    borderWidth: `${bWidthPx}px`,
                                    borderStyle: 'solid',
                                    borderColor: frame.frameColor || '#111111',
                                    boxSizing: 'content-box',
                                    borderRadius: frame.shape === 'round' ? '50%' : '0',
                                    overflow: 'hidden'
                                }}
                            >
                                <FrameContent frame={frame} ppi={PPI} />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={styles.hud}>
                <button onClick={() => setScale(s => Math.max(0.1, Math.round((s - 0.1) * 10) / 10))} title="Zoom Out">-</button>
                <span>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(5, Math.round((s + 0.1) * 10) / 10))} title="Zoom In">+</button>
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
            {isMarquee && marqueeRect && (
                <div
                    className={styles.marquee}
                    style={{
                        position: 'fixed',
                        left: Math.min(marqueeRect.x1, marqueeRect.x2),
                        top: Math.min(marqueeRect.y1, marqueeRect.y2),
                        width: Math.abs(marqueeRect.x2 - marqueeRect.x1),
                        height: Math.abs(marqueeRect.y2 - marqueeRect.y1)
                    }}
                />
            )}
            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} items={[
                    { label: 'Duplicate', shortcut: 'Ctrl+D', onClick: duplicateSelected },
                    { label: 'Bring to Front', onClick: () => handleBringToFront(contextMenu.frameId) },
                    { label: 'Send to Back', onClick: () => handleSendToBack(contextMenu.frameId) },
                    { separator: true },
                    { label: 'Remove Photo', onClick: () => handleRemovePhoto(contextMenu.frameId) },
                    { label: 'Delete Frame', danger: true, onClick: () => handleDeleteFrame(contextMenu.frameId) }
                ]} />
            )}
        </div>
    );
};

export default CanvasWorkspace;
