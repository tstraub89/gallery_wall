import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './CanvasWorkspace.module.css';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../../utils/imageStore';
import FrameContent from './FrameContent';
import ContextMenu from './ContextMenu';

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
    const [initialPositions, setInitialPositions] = useState({});
    const [hasDragged, setHasDragged] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    // Grid State
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);

    // Marquee State
    const [isMarquee, setIsMarquee] = useState(false);
    const [marqueeRect, setMarqueeRect] = useState(null); // { x1, y1, x2, y2 } in screen space

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null); // { x, y, frameId }

    // --- Helpers ---
    const snap = (val) => {
        if (!snapToGrid) return val;
        const snapPx = GRID_SIZE * PPI;
        return Math.round(val / snapPx) * snapPx;
    };

    const duplicateSelected = () => {
        if (selectedFrameIds.length === 0) return;
        const newFrames = [];
        const newLibraryItems = [];
        const newSelectedIds = [];

        currentProject.frames.forEach(f => {
            if (selectedFrameIds.includes(f.id)) {
                const newId = uuidv4();
                const newTemplateId = uuidv4();

                // Find original template info
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
    };

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

    const handleDeleteFrame = (frameId) => {
        const ids = selectedFrameIds.includes(frameId) ? selectedFrameIds : [frameId];
        const updatedFrames = currentProject.frames.filter(f => !ids.includes(f.id));
        updateProject(currentProject.id, { frames: updatedFrames });
        setSelection([]);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        if (!currentProject) return;
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Select All
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                if (focusedArea === 'library' && currentProject.images?.length > 0) {
                    setSelectedImages([...currentProject.images]);
                } else {
                    setSelection(currentProject.frames.map(f => f.id));
                }
            }

            // Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (focusedArea === 'canvas' && selectedFrameIds.length > 0) {
                    e.preventDefault();
                    handleDeleteFrame(selectedFrameIds[0]);
                }
            }

            // Duplicate (Ctrl+D)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                duplicateSelected();
            }

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo(); else undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            }

            // Nudge (Arrow Keys)
            const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
            if (isArrowKey && focusedArea === 'canvas' && selectedFrameIds.length > 0) {
                e.preventDefault();
                const distance = e.shiftKey ? 10 : 1;
                let dx = 0, dy = 0;
                if (e.key === 'ArrowUp') dy = -distance;
                if (e.key === 'ArrowDown') dy = distance;
                if (e.key === 'ArrowLeft') dx = -distance;
                if (e.key === 'ArrowRight') dx = distance;

                const updatedFrames = currentProject.frames.map(f => {
                    if (selectedFrameIds.includes(f.id)) {
                        return { ...f, x: f.x + dx, y: f.y + dy };
                    }
                    return f;
                });
                updateProject(currentProject.id, { frames: updatedFrames });
            }

            // Toggle Snapping (S)
            if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
                setSnapToGrid(prev => !prev);
            }

            // Toggle Grid (#)
            if (e.key === '#') {
                setShowGrid(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentProject, selectedFrameIds, updateProject, setSelection, undo, redo, focusedArea, setSelectedImages]);

    if (!currentProject) {
        return <div className={styles.empty}>Select a project to start planning.</div>;
    }

    // --- Block Browser Zoom (Firefox Fix) ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const zoomSensitivity = 0.001;
                const delta = -e.deltaY * zoomSensitivity;
                setScale(s => {
                    const next = Math.min(Math.max(0.1, s + delta), 5);
                    return Math.round(next * 100) / 100; // Round to nearest 1%
                });
            } else {
                setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, [scale, setScale, setPan]); // Added scale, setScale, setPan to dependencies

    // --- Handlers ---
    const handleMouseDown = (e) => {
        const { clientX, clientY } = e;
        setContextMenu(null);

        if (e.button === 2 || e.button === 1) {
            setIsPanning(true);
            setLastMouse({ x: clientX, y: clientY });
            return;
        }

        if (e.button === 0) {
            const isFrame = e.target.closest(`.${styles.frame}`);
            if (!isFrame) {
                setIsMarquee(true);
                setDragStart({ x: clientX, y: clientY });
                setMarqueeRect({ x1: clientX, y1: clientY, x2: clientX, y2: clientY });
                if (!e.shiftKey && !e.ctrlKey && !e.metaKey) selectFrame(null);
                setFocusedArea('canvas');
            }
        }
    };

    const handleFrameMouseDown = (e, frame) => {
        e.stopPropagation();
        setContextMenu(null);
        if (e.button !== 0) return;

        const isSelected = selectedFrameIds.includes(frame.id);
        let nextSelectedIds = [...selectedFrameIds];

        if (e.shiftKey) {
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
        }

        setFocusedArea('canvas');
        setIsDraggingFrame(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setHasDragged(false);

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
        } else if (isMarquee) {
            setMarqueeRect(prev => ({ ...prev, x2: clientX, y2: clientY }));
        } else if (isDraggingFrame) {
            const dx = clientX - dragStart.x;
            const dy = clientY - dragStart.y;

            if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                setHasDragged(true);
                if (e.ctrlKey || e.metaKey) {
                    const newFrames = [];
                    const newLibraryItems = [];
                    const newSelectedIds = [];
                    const newInitialPositions = {};
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

                            const newFrame = {
                                ...f,
                                id: newId,
                                templateId: newTemplateId,
                                zIndex: Math.max(0, ...currentProject.frames.map(fr => fr.zIndex || 0)) + newFrames.length + 1
                            };
                            newFrames.push(newFrame);
                            newSelectedIds.push(newId);
                            newInitialPositions[newId] = { x: f.x, y: f.y };
                        }
                    });
                    if (newFrames.length > 0) {
                        updateProject(currentProject.id, {
                            frames: [...currentProject.frames, ...newFrames],
                            library: [...currentProject.library, ...newLibraryItems]
                        });
                        setSelection(newSelectedIds);
                        setInitialPositions(newInitialPositions);
                    }
                }
            }

            const worldDx = dx / scale;
            const worldDy = dy / scale;
            setDragDelta({ x: worldDx, y: worldDy });
        }
    };

    const handleMouseUp = (e) => {
        if (isMarquee && marqueeRect) {
            const { x1, y1, x2, y2 } = marqueeRect;
            const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
            const wallEl = document.getElementById('canvas-wall');
            if (wallEl) {
                const wallRect = wallEl.getBoundingClientRect();
                const selectedIds = currentProject.frames.filter(f => {
                    const bWidthPx = (f.borderWidth || 0.1) * PPI;
                    const fx = wallRect.left + (f.x - bWidthPx) * scale;
                    const fy = wallRect.top + (f.y - bWidthPx) * scale;
                    const fw = (f.width * PPI + bWidthPx * 2) * scale;
                    const fh = (f.height * PPI + bWidthPx * 2) * scale;
                    return fx < maxX && fx + fw > minX && fy < maxY && fy + fh > minY;
                }).map(f => f.id);

                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    setSelection(Array.from(new Set([...selectedFrameIds, ...selectedIds])));
                } else {
                    setSelection(selectedIds);
                }
            }
        } else if (isDraggingFrame && !hasDragged && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            const frameEl = e.target.closest(`.${styles.frame}`);
            if (frameEl) {
                const frameId = frameEl.getAttribute('data-frame-id');
                if (frameId) selectFrame(frameId, false);
            }
        } else if (isDraggingFrame && hasDragged) {
            const updatedFrames = currentProject.frames.map(f => {
                const initPos = initialPositions[f.id];
                if (initPos) {
                    let newX = snap(initPos.x + dragDelta.x);
                    let newY = snap(initPos.y + dragDelta.y);
                    return { ...f, x: newX, y: newY };
                }
                return f;
            });
            updateProject(currentProject.id, { frames: updatedFrames });
        }

        setIsPanning(false);
        setIsDraggingFrame(false);
        setIsMarquee(false);
        setMarqueeRect(null);
        setInitialPositions({});
        setHasDragged(false);
        setDragDelta({ x: 0, y: 0 });
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        const frameEl = e.target.closest(`.${styles.frame}`);
        const frameId = frameEl ? frameEl.getAttribute('data-frame-id') : null;
        if (frameId) {
            if (!selectedFrameIds.includes(frameId)) selectFrame(frameId, false);
            setContextMenu({ x: e.clientX, y: e.clientY, frameId });
        } else {
            setContextMenu(null);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                try {
                    const imageId = uuidv4();
                    await saveImage(imageId, file);
                    addImageToLibrary(currentProject.id, imageId);
                    const frameEl = e.target.closest(`.${styles.frame}`);
                    if (frameEl) {
                        const frameId = frameEl.getAttribute('data-frame-id');
                        if (frameId) {
                            const updatedFrames = currentProject.frames.map(f => f.id === frameId ? { ...f, imageId } : f);
                            updateProject(currentProject.id, { frames: updatedFrames });
                        }
                    }
                } catch (err) { console.error("Failed to save image", err); }
            }
            return;
        }
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;
        try {
            const d = JSON.parse(dataStr);
            if (d.type === 'FRAME_LIBRARY_ITEM') {
                const rect = containerRef.current.getBoundingClientRect();
                const widthPx = d.frame.width * PPI, heightPx = d.frame.height * PPI;
                let worldX = snap(((e.clientX - rect.left) - pan.x) / scale - (widthPx / 2));
                let worldY = snap(((e.clientY - rect.top) - pan.y) / scale - (heightPx / 2));
                const newFrame = { id: uuidv4(), templateId: d.frame.id, width: d.frame.width, height: d.frame.height, matted: d.frame.matted, x: worldX, y: worldY, rotation: 0, zIndex: currentProject.frames.length + 1, imageId: null };
                updateProject(currentProject.id, { frames: [...currentProject.frames, newFrame] });
            }
            if (d.type === 'PHOTO_LIBRARY_ITEM') {
                const frameEl = e.target.closest(`.${styles.frame}`);
                if (frameEl) {
                    const frameId = frameEl.getAttribute('data-frame-id');
                    if (frameId) {
                        const updatedFrames = currentProject.frames.map(f => f.id === frameId ? { ...f, imageId: d.imageId } : f);
                        updateProject(currentProject.id, { frames: updatedFrames });
                    }
                }
            }
        } catch (err) { console.error("Drop error", err); }
    };

    const handleDragOver = (e) => e.preventDefault();

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
                        return (
                            <div key={frame.id} data-frame-id={frame.id} className={`${styles.frame} ${selectedFrameIds.includes(frame.id) ? styles.selected : ''}`} onMouseDown={(e) => handleFrameMouseDown(e, frame)} onDragStart={(e) => e.preventDefault()} style={{ left: `${displayX - bWidthPx}px`, top: `${displayY - bWidthPx}px`, width: `${frame.width * PPI}px`, height: `${frame.height * PPI}px`, transform: `rotate(${frame.rotation}deg)`, zIndex: frame.zIndex, userSelect: 'none', borderWidth: `${bWidthPx}px`, borderStyle: 'solid', boxSizing: 'content-box' }}>
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
                <button onClick={() => setShowGrid(s => !s)} style={{ background: showGrid ? 'rgba(0,122,255,0.6)' : undefined }}>#</button>
                <button onClick={() => setSnapToGrid(s => !s)} style={{ background: snapToGrid ? 'rgba(0,122,255,0.6)' : undefined }}>S</button>
            </div>
            {isMarquee && marqueeRect && containerRef.current && (() => {
                const rect = containerRef.current.getBoundingClientRect();
                return (
                    <div
                        className={styles.marquee}
                        style={{
                            left: Math.min(marqueeRect.x1, marqueeRect.x2) - rect.left,
                            top: Math.min(marqueeRect.y1, marqueeRect.y2) - rect.top,
                            width: Math.abs(marqueeRect.x2 - marqueeRect.x1),
                            height: Math.abs(marqueeRect.y2 - marqueeRect.y1)
                        }}
                    />
                );
            })()}
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
