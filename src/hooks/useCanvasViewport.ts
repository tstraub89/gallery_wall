import { useState, useEffect, RefObject } from 'react';
import { useViewport } from '../context/ViewportContext';

export const useCanvasViewport = (containerRef: RefObject<HTMLElement | null>) => {
    // Try to use global context first
    const context = useViewport();

    // Fallback local state if no provider (e.g. tests or isolated components)
    const [localScale, setLocalScale] = useState(1);
    const [localPan, setLocalPan] = useState({ x: 0, y: 0 });

    const scale = context ? context.scale : localScale;
    const setScale = context ? context.setScale : setLocalScale;
    const pan = context ? context.pan : localPan;
    const setPan = context ? context.setPan : setLocalPan;

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
                    const next = Math.min(Math.max(0.1, (typeof s === 'number' ? s : 1) + delta), 5);
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
