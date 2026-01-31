import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Reusable hook to observe when an element enters the viewport.
 */
export const useIntersectionObserver = (options: IntersectionObserverInit = {}): [RefObject<HTMLDivElement | null>, boolean] => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                // Once visible, we can stop observing if we only need one-time loading
                if (elementRef.current) {
                    observer.unobserve(elementRef.current);
                }
            }
        }, {
            root: null,
            rootMargin: '200px', // Start loading before it's actually visible
            threshold: 0.1,
            ...options
        });

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                observer.unobserve(currentElement);
            }
        };
    }, [options]); // Note: options object usually needs to be stable or this effect runs often

    return [elementRef, isVisible];
};
