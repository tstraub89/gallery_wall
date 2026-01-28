import { useState, useEffect, useRef } from 'react';

/**
 * Reusable hook to observe when an element enters the viewport.
 * @param {Object} options - IntersectionObserver options
 * @returns {[Object, boolean]} - Ref to attach to element and isVisible state
 */
export const useIntersectionObserver = (options = {}) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

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
    }, [options]);

    return [elementRef, isVisible];
};
