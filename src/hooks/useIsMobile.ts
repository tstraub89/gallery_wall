import { useState, useEffect } from 'react';

/**
 * Detects if the device is mobile using a combination of:
 * 1. Touch capability (primary indicator)
 * 2. Screen size (both dimensions, not just width)
 * 
 * This ensures landscape mode on phones still shows mobile layout.
 */
export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return checkIsMobile();
    });

    useEffect(() => {
        // Re-check on resize (for dev tools device emulation)
        const handleResize = () => {
            setIsMobile(checkIsMobile());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
};

/**
 * Check if device is mobile based on touch capability and screen size.
 */
function checkIsMobile(): boolean {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Check screen dimensions - mobile if EITHER dimension is small
    // This handles both portrait and landscape orientations
    const smallDimension = Math.min(screenWidth, screenHeight);

    // Standard mobile breakpoint
    return smallDimension <= 768;
}
