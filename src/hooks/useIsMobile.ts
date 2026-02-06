import { useState, useEffect } from 'react';

/**
 * Detects if the device is mobile using a combination of:
 * 1. Touch capability (primary indicator)
 * 2. Screen size (both dimensions, not just width)
 * 
 * This ensures landscape mode on phones still shows mobile layout.
 */
export const useIsMobile = (): boolean => {
    const [isMobile] = useState(() => {
        if (typeof window === 'undefined') return false;
        return checkIsMobile();
    });

    useEffect(() => {
        // We no longer re-check on resize to prevent jarring layout swaps.
        // Determining the layout at load time is more stable for the user.
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
