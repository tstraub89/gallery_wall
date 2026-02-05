import { useState } from 'react';

/**
 * Hook to manage Pro feature status.
 * During Beta, all features are unlocked by default.
 */
export const usePro = () => {
    // In a real app, this would check a user profile or license key
    const [isProUser] = useState(true); 
    const isBeta = true;

    return {
        // Everyone is "Pro" during Beta
        isPro: isBeta || isProUser,
        isBeta,
        // Helper to check if a feature SHOULD be restricted if not for Beta
        isPremiumFeature: (featureName: string) => {
            const premiumFeatures = [
                'smart-layout',
                'pdf-export',
                'zip-export',
                'multiple-projects',
                'staircase-wall'
            ];
            return premiumFeatures.includes(featureName);
        }
    };
};
