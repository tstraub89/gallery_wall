import { useProModal } from '../context/ProContext';

/**
 * Hook to manage Pro feature status.
 */
export const usePro = () => {
    const { isPro, isBeta, userProfile } = useProModal();

    return {
        isPro,
        isBeta,
        userProfile,
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
