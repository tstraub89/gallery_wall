import React, { useState, useRef, useEffect } from 'react';

interface SwipeDismissOptions {
    onDismiss: () => void;
    threshold?: number; // pixels
    scrollRef?: React.RefObject<HTMLElement | null>; // Optional scroll container
    isOpen?: boolean; // Track open state to reset
}

export function useSwipeDismiss({ onDismiss, threshold = 100, scrollRef, isOpen }: SwipeDismissOptions) {
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    // Track if we are currently animating out so we don't trigger multiple times
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    const startY = useRef<number | null>(null);
    const startTime = useRef<number>(0); // For velocity
    const isScrollLocked = useRef(false); // Track if we're locked into a scroll or a swipe

    // Reset offset when opened
    useEffect(() => {
        if (isOpen) {
            setOffsetY(0);
            setIsDragging(false);
            setIsAnimatingOut(false);
            isScrollLocked.current = false;
        }
    }, [isOpen]);

    // Manual trigger for backdrop clicks
    const triggerDismiss = () => {
        if (isAnimatingOut) return;
        setIsAnimatingOut(true);
        setIsDragging(false);
        setOffsetY(window.innerHeight);

        setTimeout(() => {
            onDismiss();
            // Reset isAnimatingOut will happen on next reopen via useEffect
        }, 150); // Faster 150ms
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (isAnimatingOut) return;

        startY.current = e.touches[0].clientY;
        startTime.current = Date.now();
        isScrollLocked.current = false;

        // If we have a scroll container, check if we are touching inside it
        if (scrollRef?.current) {
            const target = e.target as HTMLElement;
            const isTouchInsideScroll = scrollRef.current.contains(target);

            // If touching inside scroll area AND it is scrolled down, lock to SCROLL mode
            if (isTouchInsideScroll && scrollRef.current.scrollTop > 0) {
                isScrollLocked.current = true;
            }
        }
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (startY.current === null || isScrollLocked.current || isAnimatingOut) return;

        const currentY = e.touches[0].clientY;
        const delta = currentY - startY.current;

        // If we are ALREADY dragging, we handle the move partially to allow cancelling (dragging back up)
        if (isDragging) {
            // Allow dragging back up, but clamp at 0
            const newOffset = Math.max(0, delta);
            setOffsetY(newOffset);
            return;
        }

        // --- Not yet dragging ---

        // If dragging UP (delta < 0), let native scroll handle it if we have content
        if (delta < 0) {
            return;
        }

        // If we are dragging down (delta > 0)

        // Double check scroll status if we haven't committed to a swipe yet
        if (scrollRef?.current) {
            if (scrollRef.current.scrollTop > 0) {
                isScrollLocked.current = true;
                return;
            }
        }

        // Apply drag
        // Add resistance/damping as we pull further
        const resistedDelta = delta; // Simple linear for now, or delta * 0.5 for rubber band

        setIsDragging(true);
        setOffsetY(resistedDelta);
    };

    const onTouchEnd = () => {
        if (startY.current === null || isScrollLocked.current || isAnimatingOut) return;

        const endTime = Date.now();
        const timeDiff = endTime - startTime.current;
        const velocity = offsetY / timeDiff; // px per ms

        // Dismiss if cross threshold OR fast flick down
        if (offsetY > threshold || (offsetY > 30 && velocity > 0.5)) {
            triggerDismiss();
        } else {
            // Snap back
            setIsDragging(false);
            setOffsetY(0);
        }

        startY.current = null;
        isScrollLocked.current = false;
    };

    const style: React.CSSProperties = {
        transform: `translateY(${offsetY}px)`,
        // Instant transition while dragging, smooth spring-like when releasing
        transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)', // Faster 150ms
        touchAction: 'pan-y'
    };

    return {
        handlers: {
            onTouchStart,
            onTouchMove,
            onTouchEnd
        },
        swipeStyle: style,
        triggerDismiss // Expose for backdrop usage
    };
}
