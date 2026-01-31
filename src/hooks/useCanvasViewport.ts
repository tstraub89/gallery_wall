import { useState, useEffect, RefObject } from 'react';

export const useCanvasViewport = (containerRef: RefObject<HTMLElement | null>) => {
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // Block Browser Zoom (Firefox Fix) & Handle Wheel Zoom/Pan
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const zoomSensitivity = 0.002; // Slightly increased for better feel
                const delta = -e.deltaY * zoomSensitivity;
                setScale(s => {
                    const next = Math.min(Math.max(0.1, s + delta), 5);
                    // REMOVED ROUNDING: Store precise float preventing small deltas from being eaten
                    return next;
                });
            } else {
                setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            }
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        // Notes: running effect on every render is acceptable here to ensure 
        // listener is always attached when ref becomes available (e.g. after project load)
        return () => container.removeEventListener('wheel', onWheel);
    });

    return {
        scale,
        setScale,
        pan,
        setPan
    };
};
