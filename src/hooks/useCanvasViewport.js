import { useState, useEffect } from 'react';

export const useCanvasViewport = (containerRef) => {
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // Block Browser Zoom (Firefox Fix) & Handle Wheel Zoom/Pan
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
    }, [containerRef]);

    return {
        scale,
        setScale,
        pan,
        setPan
    };
};
