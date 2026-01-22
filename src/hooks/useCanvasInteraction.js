import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../utils/imageStore';
import { PPI, GRID_SIZE } from '../constants';
import styles from '../components/Canvas/CanvasWorkspace.module.css';

export const useCanvasInteraction = ({
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
}) => {
    // Interaction State
    const [isPanning, setIsPanning] = useState(false);
    const [isDraggingFrame, setIsDraggingFrame] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPositions, setInitialPositions] = useState({});
    const [hasDragged, setHasDragged] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });

    // Marquee State
    const [isMarquee, setIsMarquee] = useState(false);
    const [marqueeRect, setMarqueeRect] = useState(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState(null);

    // Helper: grid snapping
    const snap = (val) => {
        if (!snapToGrid) return val;
        const snapPx = GRID_SIZE * PPI;
        return Math.round(val / snapPx) * snapPx;
    };

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
                    // Logic to duplicate on drag moved to hook consumer or we implement full duplication logic here?
                    // CanvasWorkspace had duplicate logic inline inside mouse move... 
                    // Refactoring: The original code duplicated on drag start if Ctrl held.
                    // We need to replicate that.
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
            // We need to access wall rect. In component it was by ID.
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

    return {
        isMarquee,
        marqueeRect,
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
    };
};
