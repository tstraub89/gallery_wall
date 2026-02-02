import { useRef, useEffect } from 'react';

interface UseTouchGesturesProps {
    containerRef: React.RefObject<HTMLElement | null>;
    pan: { x: number; y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    onLongPress?: (e: TouchEvent) => void;
    onTap?: (e: TouchEvent) => void;
    onDoubleTap?: (e: TouchEvent) => void;

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
    pan,
    setPan,
    scale,
    setScale,
    onLongPress,
    onTap,
    onDoubleTap,
    onFrameDrag,
    onFrameDragEnd,
    isFrameSelected
}: UseTouchGesturesProps) => {
    // Touch State
    const lastTouches = useRef<{ x: number; y: number }[]>([]);
    const lastDistance = useRef<number | null>(null);

    // Refs for mutable access inside Event Listeners (prevents re-binding)
    const scaleRef = useRef(scale);
    const panRef = useRef(pan);

    // Sync Refs
    useEffect(() => { scaleRef.current = scale; }, [scale]);
    useEffect(() => { panRef.current = pan; }, [pan]);

    // Modes
    const isPanning = useRef(false);
    const isZooming = useRef(false);
    const isDraggingFrame = useRef(false);

    // Gesture Start State (for Absolute Zooming)
    const gestureStartScale = useRef<number>(1);
    const gestureStartPan = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
    const gestureStartVPC = useRef<{ x: number, y: number } | null>(null);

    // Long Press & Tap Logic
    const touchStartTime = useRef<number>(0);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const lastTapTime = useRef<number>(0);
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
                            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
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

                const dist = getDistance(e.touches[0], e.touches[1]);
                lastDistance.current = dist;

                // Capture Start State for smooth "Absolute" zooming
                // (Prevents jitter from incremental floating point errors)
                gestureStartScale.current = scaleRef.current;
                gestureStartPan.current = panRef.current;

                // Calculate Start Focal Point (relative to container)
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const rect = container.getBoundingClientRect();
                const localMidX = midX - rect.left;
                const localMidY = midY - rect.top;

                // Calculate the exact point on the "Wall" we are holding needed for the anchor
                // World = (P - Pan) / Scale
                gestureStartVPC.current = {
                    x: (localMidX - panRef.current.x) / scaleRef.current,
                    y: (localMidY - panRef.current.y) / scaleRef.current
                };

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
            if (e.touches.length === 2 && isZooming.current && lastDistance.current !== null && gestureStartVPC.current) {
                // Current Distance
                const dist = getDistance(e.touches[0], e.touches[1]);

                // Current Midpoint
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const rect = container.getBoundingClientRect();
                const localMidX = midX - rect.left;
                const localMidY = midY - rect.top;

                // Ratio from START of gesture
                const ratio = dist / lastDistance.current;

                // Calculate New Scale derived from START scale
                let newScale = gestureStartScale.current * ratio;
                newScale = Math.min(Math.max(0.1, newScale), 5); // Clamp

                // Calculate New Pan to keep the World Focal Point under the Current Midpoint
                // Pan = P_current - (World_Anchor * Scale_New)
                const newPanX = localMidX - (gestureStartVPC.current.x * newScale);
                const newPanY = localMidY - (gestureStartVPC.current.y * newScale);

                // Commit
                setScale(newScale);
                setPan({ x: newPanX, y: newPanY });
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
                const timeSinceLastTap = Date.now() - lastTapTime.current;

                if (duration < 300) {
                    if (timeSinceLastTap < 300 && onDoubleTap) {
                        // Double Tap
                        onDoubleTap(e);
                        lastTapTime.current = 0; // Reset to prevent triple-tap triggering another double
                    } else {
                        // Single Tap (Wait slightly to ensure it's not a double? Or just trigger.
                        // For this app, immediate single tap is usually preferred for selection.
                        // If we needed strict separation, we'd use a timer, but that adds lag.
                        // We will fire onTap immediately. Double tap will ALSO fire onTap likely.
                        if (onTap) onTap(e);
                        lastTapTime.current = Date.now();
                    }
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
        // Removed scale, pan, setScale, setPan from dependency array to prevent listener thrashing
        // We utilize scaleRef and panRef inside handlers for latest values
    }, [containerRef, onLongPress, onTap, onDoubleTap, onFrameDrag, onFrameDragEnd, isFrameSelected]);
};
