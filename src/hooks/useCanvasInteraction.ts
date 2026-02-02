import { useState, useRef, useEffect, RefObject } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../utils/imageStore';
import { PPI, GRID_SIZE } from '../constants';
import { Project, Frame, LibraryItem } from '../types';
import { ProjectContextType } from '../context/ProjectContextCore';

interface UseCanvasInteractionProps {
    containerRef: RefObject<HTMLDivElement | null>;
    scale: number;
    pan: { x: number; y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    currentProject: Project | null;
    updateProject: ProjectContextType['updateProject'];
    selectedFrameIds: string[];
    selectFrame: ProjectContextType['selectFrame'];
    setSelection: ProjectContextType['setSelection'];
    snapToGrid: boolean;
    addImageToLibrary: ProjectContextType['addImageToLibrary'];
    setFocusedArea: ProjectContextType['setFocusedArea'];
    frameSelector: string;
}

interface MarqueeRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface ContextMenuState {
    x: number;
    y: number;
    frameId: string;
}

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
    setFocusedArea,
    frameSelector
}: UseCanvasInteractionProps) => {
    // Interaction State
    const [isPanning, setIsPanning] = useState(false);
    const [isDraggingFrame, setIsDraggingFrame] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialPositions, setInitialPositions] = useState<Record<string, { x: number; y: number }>>({});
    const [hasDragged, setHasDragged] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
    const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
    const hasPannedRef = useRef(false);

    // Marquee State
    const [isMarquee, setIsMarquee] = useState(false);
    const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
    const [candidateFrameIds, setCandidateFrameIds] = useState<string[]>([]);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // Helper: grid snapping
    const snap = (val: number) => {
        if (!snapToGrid) return val;
        const snapPx = GRID_SIZE * PPI;
        return Math.round(val / snapPx) * snapPx;
    };

    // Force prevent native context menu to allow custom Right-Click/Pan interactions
    // Using Capture Phase to intercept BEFORE bubbling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleNativeContext = (e: Event) => e.preventDefault();
        container.addEventListener('contextmenu', handleNativeContext, { capture: true });
        return () => container.removeEventListener('contextmenu', handleNativeContext, { capture: true });
    }, [containerRef]);

    // --- Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        setContextMenu(null);
        hasPannedRef.current = false;

        // Right Click (2) or Middle Click (1) -> Pan
        if (e.button === 2 || e.button === 1) {
            setIsPanning(true);
            setLastMouse({ x: clientX, y: clientY });
            return;
        }

        // Left Click (0) -> Marquee (if clicked on background)
        if (e.button === 0) {
            const tempTarget = e.target as HTMLElement;
            // Note: If clicking Wall (with pointerEvents: auto), it is NOT a frame.
            // So this runs.
            const isFrame = tempTarget.closest(`.${frameSelector}`);
            if (!isFrame) {
                setIsMarquee(true);
                setDragStart({ x: clientX, y: clientY });
                setMarqueeRect({ x1: clientX, y1: clientY, x2: clientX, y2: clientY });
                setCandidateFrameIds([]); // Reset candidates
                if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelection([]);
                setFocusedArea('canvas');
            }
        }
    };

    const handleFrameMouseDown = (e: React.MouseEvent, frame: Frame) => {
        // ALWAYS Stop propagation for any frame click to prevent Container actions (like Panning or Deselection)
        e.stopPropagation();
        setContextMenu(null);
        // Reset pan flag so context menu works after panning on background
        hasPannedRef.current = false;

        // Only handle Left Click for Frame Selection/Dragging
        // Right Click logic is handled by handleContextMenu (which bubbles from here to container)
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

        const positions: Record<string, { x: number; y: number }> = {};
        if (currentProject) {
            currentProject.frames.forEach(f => {
                if (nextSelectedIds.includes(f.id)) {
                    positions[f.id] = {
                        x: Number.isFinite(f.x) ? f.x : 0,
                        y: Number.isFinite(f.y) ? f.y : 0
                    };
                }
            });
        }
        setInitialPositions(positions);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        if (isPanning) {
            const dx = clientX - lastMouse.x;
            const dy = clientY - lastMouse.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                hasPannedRef.current = true;
            }
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMouse({ x: clientX, y: clientY });
        } else if (isMarquee && marqueeRect) {
            const newMarqueeRect = { ...marqueeRect, x2: clientX, y2: clientY };
            setMarqueeRect(newMarqueeRect);

            // Calculate candidates
            if (containerRef.current && currentProject) {
                const rect = containerRef.current.getBoundingClientRect();
                const minX = Math.min(newMarqueeRect.x1, newMarqueeRect.x2);
                const maxX = Math.max(newMarqueeRect.x1, newMarqueeRect.x2);
                const minY = Math.min(newMarqueeRect.y1, newMarqueeRect.y2);
                const maxY = Math.max(newMarqueeRect.y1, newMarqueeRect.y2);

                const wallX1 = (minX - rect.left - pan.x) / scale;
                const wallX2 = (maxX - rect.left - pan.x) / scale;
                const wallY1 = (minY - rect.top - pan.y) / scale;
                const wallY2 = (maxY - rect.top - pan.y) / scale;

                const candidates = currentProject.frames.filter(f => {
                    const bWidthPx = (typeof f.borderWidth === 'number' ? f.borderWidth : 0.1) * PPI;
                    return (
                        (f.x - bWidthPx) < wallX2 &&
                        (f.x + f.width * PPI + bWidthPx) > wallX1 &&
                        (f.y - bWidthPx) < wallY2 &&
                        (f.y + f.height * PPI + bWidthPx) > wallY1
                    );
                }).map(f => f.id);

                // FILTER LOCKED FRAMES from marquee candidates
                const unlockedCandidates = candidates.filter(id => {
                    const f = currentProject.frames.find(fr => fr.id === id);
                    return f && !f.locked;
                });

                setCandidateFrameIds(unlockedCandidates);
            }

        } else if (isDraggingFrame) {
            // Check if ANY selected frame is locked. If so, prevent movement.
            const hasLockedSelected = currentProject?.frames.some(f => selectedFrameIds.includes(f.id) && f.locked);
            if (hasLockedSelected) {
                // Do not update dragDelta or hasDragged if locked frames are involved
                return;
            }

            const dx = clientX - dragStart.x;
            const dy = clientY - dragStart.y;

            if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                setHasDragged(true);
                if ((e.ctrlKey || e.metaKey) && currentProject) {
                    const newFrames: Frame[] = [];
                    const newLibraryItems: LibraryItem[] = [];
                    const newSelectedIds: string[] = [];
                    const newInitialPositions: Record<string, { x: number; y: number }> = {};

                    currentProject.frames.forEach(f => {
                        if (selectedFrameIds.includes(f.id)) {
                            const newId = uuidv4();
                            const newTemplateId = uuidv4();
                            const originalTemplate = currentProject.library.find(t => t.id === f.templateId);

                            if (originalTemplate) {
                                newLibraryItems.push({
                                    ...originalTemplate,
                                    id: newTemplateId,
                                    isDuplicate: true,
                                    count: 1
                                } as LibraryItem);
                            }

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

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isMarquee && marqueeRect) {
            // Commit candidates
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                setSelection(Array.from(new Set([...selectedFrameIds, ...candidateFrameIds])));
            } else {
                setSelection(candidateFrameIds);
            }
        } else if (isDraggingFrame && !hasDragged && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            const tempTarget = e.target as HTMLElement;
            const frameEl = tempTarget.closest(`.${frameSelector}`);
            if (frameEl) {
                const frameId = frameEl.getAttribute('data-frame-id');
                if (frameId) selectFrame(frameId, false);
            }
        } else if (isDraggingFrame && hasDragged && currentProject) {
            const updatedFrames = currentProject.frames.map(f => {
                const { x: worldDx, y: worldDy } = dragDelta;
                if (selectedFrameIds.includes(f.id) && initialPositions[f.id]) {
                    const start = initialPositions[f.id];

                    // SNAP TO OUTER EDGES (Visual Bounds)
                    // If snapToGrid is on, we want the VISUAL Left/Top to align with grid.
                    // VisualLeft = InnerX - Border
                    // We want VisualLeft to be Snapped.
                    // InnerX = SnappedVisualLeft + Border

                    const bWidth = typeof f.borderWidth === 'number' ? f.borderWidth : 0.1;
                    const bWidthPx = bWidth * PPI;

                    // Calculate proposed VISUAL position
                    const visualX = start.x + worldDx - bWidthPx;
                    const visualY = start.y + worldDy - bWidthPx;

                    // Snap the visual position
                    const snappedVisualX = snap(visualX);
                    const snappedVisualY = snap(visualY);

                    // Convert back to Inner position
                    const newX = snappedVisualX + bWidthPx;
                    const newY = snappedVisualY + bWidthPx;

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
        setCandidateFrameIds([]);
        setInitialPositions({});
        setHasDragged(false);
        setDragDelta({ x: 0, y: 0 });
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        // If we panned, we do NOT show the context menu
        if (hasPannedRef.current) return;

        const tempTarget = e.target as HTMLElement;
        const frameEl = tempTarget.closest(`.${frameSelector}`);
        const frameId = frameEl ? frameEl.getAttribute('data-frame-id') : null;
        if (frameId) {
            if (!selectedFrameIds.includes(frameId)) selectFrame(frameId, false);
            setContextMenu({ x: e.clientX, y: e.clientY, frameId });
        } else {
            setContextMenu(null);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (!currentProject) return;

        if (e.dataTransfer.files?.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                try {
                    const imageId = uuidv4();
                    await saveImage(imageId, file);
                    addImageToLibrary(currentProject.id, imageId);
                    const tempTarget = e.target as HTMLElement;
                    const frameEl = tempTarget.closest(`.${frameSelector}`);
                    if (frameEl) {
                        const frameId = frameEl.getAttribute('data-frame-id');
                        if (frameId) {
                            const updatedFrames = currentProject.frames.map(f => f.id === frameId ? { ...f, imageId, imageState: null } : f);
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
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();
                const widthPx = d.frame.width * PPI, heightPx = d.frame.height * PPI;
                const worldX = snap(((e.clientX - rect.left) - pan.x) / scale - (widthPx / 2));
                const worldY = snap(((e.clientY - rect.top) - pan.y) / scale - (heightPx / 2));
                const newFrame: Frame = {
                    id: uuidv4(),
                    templateId: d.frame.id,
                    width: d.frame.width,
                    height: d.frame.height,
                    label: d.frame.label,
                    shape: d.frame.shape || 'rect',
                    frameColor: d.frame.frameColor || '#111111',
                    matted: d.frame.matted,
                    borderWidth: d.frame.borderWidth,
                    x: worldX, y: worldY,
                    rotation: 0,
                    zIndex: currentProject.frames.length + 1,
                    imageId: null,
                    imageState: null
                };
                updateProject(currentProject.id, { frames: [...currentProject.frames, newFrame] });
            }
            if (d.type === 'PHOTO_LIBRARY_ITEM') {
                const tempTarget = e.target as HTMLElement;
                const frameEl = tempTarget.closest(`.${frameSelector}`);
                if (frameEl) {
                    const frameId = frameEl.getAttribute('data-frame-id');
                    if (frameId) {
                        const updatedFrames = currentProject.frames.map(f => f.id === frameId ? { ...f, imageId: d.imageId, imageState: null } : f);
                        updateProject(currentProject.id, { frames: updatedFrames });
                    }
                }
            }
        } catch (err) { console.error("Drop error", err); }
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    return {
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
    };
};
