import { useState, useRef, RefObject } from 'react';
import { Project } from '../types';
import { PPI } from '../constants';
import { ProjectContextType } from '../context/ProjectContextCore';

interface UseCanvasSelectionProps {
    containerRef: RefObject<HTMLDivElement | null>;
    scale: number;
    pan: { x: number; y: number };
    currentProject: Project | null;
    selectedFrameIds: string[];
    setSelection: ProjectContextType['setSelection'];
    setFocusedArea: ProjectContextType['setFocusedArea'];
    frameSelector: string; // e.g. '.frame'
}

interface MarqueeRect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export const useCanvasSelection = ({
    containerRef,
    scale,
    pan,
    currentProject,
    selectedFrameIds,
    setSelection,
    setFocusedArea,
    frameSelector
}: UseCanvasSelectionProps) => {

    const [isMarquee, setIsMarquee] = useState(false);
    const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
    const [candidateFrameIds, setCandidateFrameIds] = useState<string[]>([]);

    const dragStart = useRef({ x: 0, y: 0 });
    const lastThrottleTime = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only handle Left Click (0)
        if (e.button !== 0) return;

        const tempTarget = e.target as HTMLElement;
        const isFrame = tempTarget.closest(`.${frameSelector}`);

        // If clicking background (not frame)
        if (!isFrame) {
            setIsMarquee(true);
            dragStart.current = { x: e.clientX, y: e.clientY };
            setMarqueeRect({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY });
            setCandidateFrameIds([]);

            if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                setSelection([]);
            }
            setFocusedArea('canvas');
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isMarquee || !marqueeRect) return;

        // Visual update (cheap)
        const newMarqueeRect = { ...marqueeRect, x2: e.clientX, y2: e.clientY };
        setMarqueeRect(newMarqueeRect);

        // Throttle heavy geometric calculation (~60fps)
        const now = performance.now();
        if (now - lastThrottleTime.current < 16) return;
        lastThrottleTime.current = now;

        if (containerRef.current && currentProject) {
            const rect = containerRef.current.getBoundingClientRect();
            const minX = Math.min(newMarqueeRect.x1, newMarqueeRect.x2);
            const maxX = Math.max(newMarqueeRect.x1, newMarqueeRect.x2);
            const minY = Math.min(newMarqueeRect.y1, newMarqueeRect.y2);
            const maxY = Math.max(newMarqueeRect.y1, newMarqueeRect.y2);

            // Convert marquee screen coords to Wall Coords
            const wallX1 = (minX - rect.left - pan.x) / scale;
            const wallX2 = (maxX - rect.left - pan.x) / scale;
            const wallY1 = (minY - rect.top - pan.y) / scale;
            const wallY2 = (maxY - rect.top - pan.y) / scale;

            const candidates = currentProject.frames.filter(f => {
                const bWidthPx = (typeof f.borderWidth === 'number' ? f.borderWidth : 0.1) * PPI;
                // AABB Intersection Test
                return (
                    (f.x - bWidthPx) < wallX2 &&
                    (f.x + f.width * PPI + bWidthPx) > wallX1 &&
                    (f.y - bWidthPx) < wallY2 &&
                    (f.y + f.height * PPI + bWidthPx) > wallY1
                );
            }).map(f => f.id);

            // Exclude locked frames
            const unlockedCandidates = candidates.filter(id => {
                const f = currentProject.frames.find(fr => fr.id === id);
                return f && !f.locked;
            });

            setCandidateFrameIds(unlockedCandidates);
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isMarquee && marqueeRect) {
            let nextSelection = candidateFrameIds;

            // Handle Multi-select modifiers
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                nextSelection = Array.from(new Set([...selectedFrameIds, ...candidateFrameIds]));
            }

            setSelection(nextSelection);
        }

        // Always reset marquee/candidates on mouse up if we were in that mode
        setIsMarquee(false);
        setMarqueeRect(null);
        setCandidateFrameIds([]);
    };

    return {
        isMarquee,
        marqueeRect,
        candidateFrameIds,
        handleSelectionMouseDown: handleMouseDown,
        handleSelectionMouseMove: handleMouseMove,
        handleSelectionMouseUp: handleMouseUp
    };
};
