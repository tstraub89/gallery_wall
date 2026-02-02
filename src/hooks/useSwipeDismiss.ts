import { useState, useRef, TouchEvent } from 'react';

interface SwipeDismissOptions {
    onDismiss: () => void;
    threshold?: number; // pixels
}

export function useSwipeDismiss({ onDismiss, threshold = 100 }: SwipeDismissOptions) {
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef<number | null>(null);

    const onTouchStart = (e: TouchEvent) => {
        startY.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const onTouchMove = (e: TouchEvent) => {
        if (startY.current === null) return;

        const currentY = e.touches[0].clientY;
        const delta = currentY - startY.current;

        // Allow dragging, but clamp to 0 (don't allow dragging up past start)
        const newOffset = Math.max(0, delta);
        setOffsetY(newOffset);
    };

    const onTouchEnd = () => {
        if (offsetY > threshold) {
            onDismiss();
        } else {
            // Snap back
            setOffsetY(0);
        }
        setIsDragging(false);
        startY.current = null;
    };

    return {
        handlers: {
            onTouchStart,
            onTouchMove,
            onTouchEnd
        },
        swipeStyle: {
            transform: `translateY(${offsetY}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        } as React.CSSProperties
    };
}
