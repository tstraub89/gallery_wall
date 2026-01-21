import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './CanvasWorkspace.module.css';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../../utils/imageStore';
import FrameContent from './FrameContent';

import { PPI, GRID_SIZE } from '../../constants';

const CanvasWorkspace = () => {
    const { currentProject, updateProject, selectFrame, selectedFrameIds, setSelection, addImageToLibrary, undo, redo, canUndo, canRedo, focusedArea, setFocusedArea, selectedImageIds, setSelectedImages } = useProject();

    // Viewport State
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Interaction State
    const [isPanning, setIsPanning] = useState(false);
    const [isDraggingFrame, setIsDraggingFrame] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    // Map of frameId -> {x, y}
    const [initialPositions, setInitialPositions] = useState({});
    const [hasDragged, setHasDragged] = useState(false);

    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    // Grid State
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);


    // Keyboard Shortcuts
    useEffect(() => {
        if (!currentProject) return;

        const handleKeyDown = (e) => {
            // Ignore if input is active
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Select All (Ctrl/Cmd + A)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                if (focusedArea === 'library' && currentProject.images?.length > 0) {
                    // Select all photos
                    setSelectedImages([...currentProject.images]);
                } else {
                    // Default: select all frames
                    setSelection(currentProject.frames.map(f => f.id));
                }
            }

            // Delete / Backspace
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedFrameIds.length > 0) {
                    e.preventDefault();
                    const updatedFrames = currentProject.frames.filter(f => !selectedFrameIds.includes(f.id));
                    updateProject(currentProject.id, { frames: updatedFrames });
                    setSelection([]);
                }
            }
            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Redo
                    redo();
                } else {
                    // Undo
                    undo();
                }
            }
            // Redo standard (Ctrl+Y)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentProject, selectedFrameIds, updateProject, setSelection, undo, redo, focusedArea, setSelectedImages]);

    if (!currentProject) {
        return <div className={styles.empty}>Select a project to start planning.</div>;
    }

    const snap = (val) => {
        if (!snapToGrid) return val;
        const snapPx = GRID_SIZE * PPI;
        return Math.round(val / snapPx) * snapPx;
    };

    // --- Handlers ---
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const newScale = Math.min(Math.max(0.1, scale + delta), 5);
            setScale(newScale);
        } else {
            e.preventDefault();
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e) => {
        const { clientX, clientY } = e;

        // Check for Middle Click (Pan) OR Left Click on Background (Pan)
        // If clicking on a frame, we let handleFrameMouseDown handle it.
        const isFrame = e.target.closest(`.${styles.frame}`);

        if (e.button === 1 || (e.button === 0 && !isFrame)) {
            setIsPanning(true);
            setLastMouse({ x: clientX, y: clientY });
            // If Left Click on background, also deselect
            if (e.button === 0) {
                selectFrame(null);
                setFocusedArea('canvas');
            }
            // e.preventDefault(); // Prevents text selection etc.
            return;
        }

        // Frame logic is handled by stopPropagation in handleFrameMouseDown, 
        // but if we are here, e.target IS a frame? 
        // No, we check !isFrame above.
        // If isFrame is true:
        //  e.button === 1 -> enters if.
        //  e.button === 0 -> does NOT enter if.
        // So if Left Click on Frame, we fall through.

        // Actually handleFrameMouseDown calls stopPropagation, so we shouldn't even reach here for Frame Clicks!
        // handleFrameMouseDown is on the Frame element.
        // handleMouseDown is on the Container.

        // So we can assume if we are here, IT IS BACKGROUND.

        if (e.button === 0 || e.button === 1) {
            setIsPanning(true);
            setLastMouse({ x: clientX, y: clientY });
            if (e.button === 0) {
                selectFrame(null);
                setFocusedArea('canvas');
            }
        }
    };

    const handleFrameMouseDown = (e, frame) => {
        e.stopPropagation();
        if (e.button !== 0) return;

        const isSelected = selectedFrameIds.includes(frame.id);
        let nextSelectedIds = [...selectedFrameIds];

        // Multi-select with Shift OR Ctrl/Cmd
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            if (isSelected) {
                nextSelectedIds = nextSelectedIds.filter(id => id !== frame.id);
                selectFrame(frame.id, true);
            } else {
                nextSelectedIds.push(frame.id);
                selectFrame(frame.id, true);
            }
        } else {
            if (!isSelected) {
                nextSelectedIds = [frame.id];
                selectFrame(frame.id, false);
            }
            // If already selected, do not change selection yet (preserve group)
        }

        setFocusedArea('canvas');

        setIsDraggingFrame(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setHasDragged(false);

        // Snapshot positions for ALL selected frames (or future selected)
        const positions = {};
        currentProject.frames.forEach(f => {
            if (nextSelectedIds.includes(f.id)) {
                positions[f.id] = { x: f.x, y: f.y };
            }
        });
        setInitialPositions(positions);
    };


    const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        if (isPanning) {
            const dx = clientX - lastMouse.x;
            const dy = clientY - lastMouse.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMouse({ x: clientX, y: clientY });
        } else if (isDraggingFrame) {
            const dx = clientX - dragStart.x;
            const dy = clientY - dragStart.y;

            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                setHasDragged(true);
            }

            const worldDx = dx / scale;
            const worldDy = dy / scale;

            // Just update local state for smooth rendering without hitting DB
            // We use standard React state which re-renders visual components quickly
            setDragDelta({ x: worldDx, y: worldDy });
        }
    };

    const handleMouseUp = (e) => {
        // Only reset to single selection if no modifier keys held
        if (isDraggingFrame && !hasDragged && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            // Clicked (no drag) on a frame.
            // If it was a group member, we should now select JUST it.
            // We can find which frame was under cursor?
            // Actually relying on e.target.closest should work since we bubble up?
            // Wait, this handler is on Container.
            const frameEl = e.target.closest(`.${styles.frame}`);
            if (frameEl) {
                const frameId = frameEl.getAttribute('data-frame-id');
                if (frameId) {
                    selectFrame(frameId, false);
                }
            }
        } else if (isDraggingFrame && hasDragged) {
            // Commit changes
            const updatedFrames = currentProject.frames.map(f => {
                const initPos = initialPositions[f.id];
                if (initPos) {
                    let newX = initPos.x + dragDelta.x;
                    let newY = initPos.y + dragDelta.y;

                    if (snapToGrid) {
                        newX = snap(newX);
                        newY = snap(newY);
                    }
                    return { ...f, x: newX, y: newY };
                }
                return f;
            });
            updateProject(currentProject.id, { frames: updatedFrames });
        }

        setIsPanning(false);
        setIsDraggingFrame(false);
        setInitialPositions({});
        setHasDragged(false);
        setDragDelta({ x: 0, y: 0 }); // Reset local delta
    };

    // --- Drop Handler ---
    const handleDrop = async (e) => {
        e.preventDefault();

        // 1. Handle File Drops (Images from OS)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                try {
                    // Always save to library first
                    const imageId = uuidv4();
                    await saveImage(imageId, file);
                    addImageToLibrary(currentProject.id, imageId);

                    // If dropped on a frame, apply it
                    const frameEl = e.target.closest(`.${styles.frame}`);
                    if (frameEl) {
                        const frameId = frameEl.getAttribute('data-frame-id');
                        if (frameId) {
                            const updatedFrames = currentProject.frames.map(f =>
                                f.id === frameId ? { ...f, imageId } : f
                            );
                            updateProject(currentProject.id, { frames: updatedFrames });
                        }
                    }
                } catch (err) {
                    console.error("Failed to save image", err);
                }
            }
            return;
        }

        // 2. Handle Application Drops (JSON)
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        try {
            const data = JSON.parse(dataStr);

            // A. Frame Template Drop
            if (data.type === 'FRAME_LIBRARY_ITEM') {
                const rect = containerRef.current.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const frame = data.frame;
                const widthPx = frame.width * PPI;
                const heightPx = frame.height * PPI;

                let worldX = (mouseX - pan.x) / scale - (widthPx / 2);
                let worldY = (mouseY - pan.y) / scale - (heightPx / 2);

                if (snapToGrid) {
                    worldX = snap(worldX);
                    worldY = snap(worldY);
                }

                const newFrame = {
                    id: uuidv4(),
                    templateId: frame.id,
                    width: frame.width,
                    height: frame.height,
                    matted: frame.matted,
                    x: worldX,
                    y: worldY,
                    rotation: 0,
                    zIndex: currentProject.frames.length + 1,
                    imageId: null
                };

                updateProject(currentProject.id, {
                    frames: [...currentProject.frames, newFrame]
                });
            }

            // B. Photo Library Drop
            if (data.type === 'PHOTO_LIBRARY_ITEM') {
                const frameEl = e.target.closest(`.${styles.frame}`);
                if (frameEl) {
                    const frameId = frameEl.getAttribute('data-frame-id');
                    if (frameId) {
                        const updatedFrames = currentProject.frames.map(f =>
                            f.id === frameId ? { ...f, imageId: data.imageId } : f
                        );
                        updateProject(currentProject.id, { frames: updatedFrames });
                    }
                }
            }
        } catch (err) {
            console.error("Drop error", err);
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    return (
        <div
            className={styles.container}
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div
                className={styles.world}
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
            >
                <div
                    id="canvas-wall"
                    className={`${styles.wall} ${showGrid ? styles.grid : ''} ${styles[currentProject.wallConfig.type]}`}
                    style={{
                        width: `${currentProject.wallConfig.width * PPI}px`,
                        height: `${currentProject.wallConfig.height * PPI}px`,
                        backgroundColor: currentProject.wallConfig.backgroundColor,
                        '--grid-size': `${GRID_SIZE * PPI}px`
                    }}
                >
                    {currentProject.frames.map(frame => {
                        const isDraggingThis = selectedFrameIds.includes(frame.id) && isDraggingFrame && hasDragged;
                        let displayX = frame.x;
                        let displayY = frame.y;

                        if (isDraggingThis) {
                            // Calculate display position based on local dragDelta + initial pos
                            const initPos = initialPositions[frame.id];
                            if (initPos) {
                                let newX = initPos.x + dragDelta.x;
                                let newY = initPos.y + dragDelta.y;
                                if (snapToGrid) {
                                    newX = snap(newX);
                                    newY = snap(newY);
                                }
                                displayX = newX;
                                displayY = newY;
                            }
                        }

                        const bWidthPx = frame.borderWidth !== undefined ? frame.borderWidth * PPI : 1;

                        return (
                            <div
                                key={frame.id}
                                data-frame-id={frame.id}
                                className={`${styles.frame} ${selectedFrameIds.includes(frame.id) ? styles.selected : ''}`}
                                onMouseDown={(e) => handleFrameMouseDown(e, frame)}
                                onDragStart={(e) => e.preventDefault()}
                                style={{
                                    left: `${displayX - bWidthPx}px`,
                                    top: `${displayY - bWidthPx}px`,
                                    width: `${frame.width * PPI}px`,
                                    height: `${frame.height * PPI}px`,
                                    transform: `rotate(${frame.rotation}deg)`,
                                    zIndex: frame.zIndex,
                                    userSelect: 'none',
                                    // Frame Thickness logic: Additive
                                    borderWidth: `${bWidthPx}px`,
                                    borderStyle: 'solid',
                                    boxSizing: 'content-box'
                                }}
                            >
                                <FrameContent frame={frame} ppi={PPI} />
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className={styles.hud}>
                <button onClick={() => setScale(s => s + 0.1)} title="Zoom In">+</button>
                <span>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} title="Zoom Out">-</button>
                <div className={styles.separator} />
                <button
                    onClick={() => setShowGrid(s => !s)}
                    style={{ background: showGrid ? 'rgba(0,122,255,0.6)' : undefined }}
                    title="Toggle Grid"
                >#</button>
                <button
                    onClick={() => setSnapToGrid(s => !s)}
                    style={{ background: snapToGrid ? 'rgba(0,122,255,0.6)' : undefined }}
                    title="Snap to Grid"
                >S</button>
            </div>
        </div>
    );
};

export default CanvasWorkspace;
