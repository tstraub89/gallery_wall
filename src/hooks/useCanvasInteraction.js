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
    const [candidateFrameIds, setCandidateFrameIds] = useState([]);

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
                setCandidateFrameIds([]); // Reset candidates
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
            const newMarqueeRect = { ...marqueeRect, x2: clientX, y2: clientY };
            setMarqueeRect(newMarqueeRect);

            // Calculate candidates
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const minX = Math.min(newMarqueeRect.x1, newMarqueeRect.x2);
                const maxX = Math.max(newMarqueeRect.x1, newMarqueeRect.x2);
                const minY = Math.min(newMarqueeRect.y1, newMarqueeRect.y2);
                const maxY = Math.max(newMarqueeRect.y1, newMarqueeRect.y2);

                // Convert marquee bounds to Wall Space
                // FrameScreenX = ContainerX + PanX + (50+FrameWallX)*Scale
                // FrameWallX = ((FrameScreenX - ContainerX - PanX) / Scale) - 50

                const wallX1 = ((minX - rect.left - pan.x) / scale) - 50;
                const wallX2 = ((maxX - rect.left - pan.x) / scale) - 50;
                const wallY1 = ((minY - rect.top - pan.y) / scale) - 50;
                const wallY2 = ((maxY - rect.top - pan.y) / scale) - 50;

                const candidates = currentProject.frames.filter(f => {
                    const bWidthPx = (f.borderWidth || 0.1) * PPI;

                    // Wait, rendering adds border width outside?
                    // CanvasWorkspace: left: `${displayX - bWidthPx}px`
                    // So frame.x is the content left. Visual left is frame.x - border.

                    return (
                        (f.x - bWidthPx) < wallX2 &&
                        (f.x + f.width * PPI + bWidthPx) > wallX1 &&
                        (f.y - bWidthPx) < wallY2 &&
                        (f.y + f.height * PPI + bWidthPx) > wallY1
                    );
                }).map(f => f.id);
                setCandidateFrameIds(candidates);
            }

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
            // Commit candidates
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                setSelection(Array.from(new Set([...selectedFrameIds, ...candidateFrameIds])));
            } else {
                setSelection(candidateFrameIds);
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
        setCandidateFrameIds([]); // Check reset
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
        candidateFrameIds, // Exposed
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
