import { useRef, useEffect } from 'react';

interface UseTouchGesturesProps {
    containerRef: React.RefObject<HTMLElement | null>;
    pan: { x: number; y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    onLongPress?: (e: TouchEvent) => void;
    onTap?: (e: TouchEvent) => void;

    // Handle Frame Dragging
    // Callback receives the TOTAL delta from the start of the drag gesture (screen pixels)
    // This allows the parent to calculate absolute position and snap robustly
    onFrameDrag?: (totalDeltaX: number, totalDeltaY: number) => void;

    // Callback when dragging ends (finger up) - useful for cleanup
    onFrameDragEnd?: () => void;

    isFrameSelected?: (target: EventTarget | null) => boolean;
}

export const useTouchGestures = ({
    containerRef,
    setPan,
    setScale,
    onLongPress,
    onTap,
    onFrameDrag,
    onFrameDragEnd,
    isFrameSelected
}: UseTouchGesturesProps) => {
    // Touch State
    const lastTouches = useRef<{ x: number; y: number }[]>([]);
    const lastDistance = useRef<number | null>(null);

    // Modes
    const isPanning = useRef(false);
    const isZooming = useRef(false);
    const isDraggingFrame = useRef(false);

    // Long Press & Tap Logic
    const touchStartTime = useRef<number>(0);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const hasMoved = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Euclidean distance between two points
        const getDistance = (t1: Touch, t2: Touch) => {
            const dx = t1.clientX - t2.clientX;
            const dy = t1.clientY - t2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const handleTouchStart = (e: TouchEvent) => {
            const target = e.target as HTMLElement;

            // 1. UI Safety: If touching a button or interactive UI element, let browser handle it.
            if (target.closest('button') || target.closest('input') || target.closest('a')) {
                return;
            }

            // We prevent default to stop scrolling, but ONLY if we are capturing this interaction
            if (e.touches.length === 2 || e.touches.length === 1) e.preventDefault();

            lastTouches.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));

            // Single Finger: Decide Pan vs Drag Frame
            if (e.touches.length === 1) {
                // Check if we are touching a selected frame
                const frameSelected = isFrameSelected ? isFrameSelected(target) : false;

                if (frameSelected) {
                    isDraggingFrame.current = true;
                    isPanning.current = false;
                } else {
                    isPanning.current = true;
                    isDraggingFrame.current = false;
                }

                isZooming.current = false;

                // Tap / Long Press Setup
                touchStartTime.current = Date.now();
                touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                hasMoved.current = false;

                if (onLongPress) {
                    longPressTimer.current = setTimeout(() => {
                        if (!hasMoved.current) {
                            onLongPress(e);
                        }
                    }, 500); // 500ms long press
                }
            }
            // Pinch Zoom Start
            else if (e.touches.length === 2) {
                isPanning.current = false;
                isDraggingFrame.current = false;
                isZooming.current = true;
                lastDistance.current = getDistance(e.touches[0], e.touches[1]);

                // Cancel Tap/LongPress tasks
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            // Only prevent default if we are actively managing state (which we usually are if listeners are active)
            const target = e.target as HTMLElement;
            if (target.closest('button') || target.closest('input')) return;

            if (e.touches.length === 2 || e.touches.length === 1) e.preventDefault();

            // Check movement for Tap/LongPress cancellation
            if (e.touches.length === 1 && touchStartPos.current) {
                const dx = e.touches[0].clientX - touchStartPos.current.x;
                const dy = e.touches[0].clientY - touchStartPos.current.y;
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    hasMoved.current = true;
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                    }
                }
            }

            // 1 Finger Logic
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const last = lastTouches.current[0];
                if (last) {
                    const dx = touch.clientX - last.x;
                    const dy = touch.clientY - last.y;

                    if (isDraggingFrame.current && onFrameDrag && touchStartPos.current) {
                        // For dragging frames, we send the TOTAL delta from start
                        // This prevents accumulation errors and allows robust "snap" logic
                        const totalDx = touch.clientX - touchStartPos.current.x;
                        const totalDy = touch.clientY - touchStartPos.current.y;
                        onFrameDrag(totalDx, totalDy);
                    }
                    else if (isPanning.current) {
                        // For pan, we still use incremental (feels appropriate for infinite canvas)
                        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
                    }
                }
                lastTouches.current = [{ x: touch.clientX, y: touch.clientY }];
            }

            // PINCH ZOOMING (2 Fingers)
            if (e.touches.length === 2 && isZooming.current && lastDistance.current !== null) {
                const dist = getDistance(e.touches[0], e.touches[1]);
                const ratio = dist / lastDistance.current;

                // Apply Zoom
                setScale(s => {
                    const newScale = Math.min(Math.max(0.1, s * ratio), 5);
                    return newScale;
                });

                lastDistance.current = dist;
                lastTouches.current = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            // Cleanup Long Press
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }

            // Detect Tap
            if (e.touches.length === 0 && !hasMoved.current && !isZooming.current && (isPanning.current || isDraggingFrame.current)) {
                // If duration was short, it's a tap
                const duration = Date.now() - touchStartTime.current;
                if (duration < 300 && onTap) {
                    onTap(e);
                }
            }

            // Trigger end drag callback if we were dragging
            if (isDraggingFrame.current && onFrameDragEnd) {
                onFrameDragEnd();
            }

            if (e.touches.length === 0) {
                isPanning.current = false;
                isDraggingFrame.current = false;
                isZooming.current = false;
                lastDistance.current = null;
            } else if (e.touches.length === 1) {
                // If we went from 2 fingers to 1, reset to prevent jump
                isPanning.current = true; // Fallback to safe Pan
                isDraggingFrame.current = false;
                isZooming.current = false;
                lastTouches.current = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
                // Reset touch start pos to prevent jumpy drags if we somehow switch modes
                touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [containerRef, setPan, setScale, onLongPress, onTap, onFrameDrag, onFrameDragEnd, isFrameSelected]);
};
