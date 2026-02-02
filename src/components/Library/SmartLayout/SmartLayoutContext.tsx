import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useLayoutRecommender } from '../../../hooks/useLayoutRecommender';
import { RecommenderConfig, LayoutSolution } from '../../../recommender/types';

interface SmartLayoutContextType {
    config: RecommenderConfig;
    setConfig: (config: RecommenderConfig) => void;
    generateLayouts: ReturnType<typeof useLayoutRecommender>['generateLayouts'];
    isGenerating: boolean;
    solutions: LayoutSolution[];
    // We expose these too just in case
    cancelGeneration: () => void;
    progress: number;
    lastPlacedFrameIds: string[];
    setLastPlacedFrameIds: (ids: string[]) => void;
    hasAttempted: boolean;
    setHasAttempted: (v: boolean) => void;
}

const SmartLayoutContext = createContext<SmartLayoutContextType | undefined>(undefined);

export const SmartLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { generateLayouts, isGenerating, solutions, cancelGeneration, progress } = useLayoutRecommender();

    const [config, setConfig] = useState<RecommenderConfig>({
        algorithm: 'masonry', // Default to Masonry
        spacing: 2, // inches
        margin: 3, // inches
        forceAll: false,
        vibe: 'structured'
    });

    // Track frames added by the current auto-arrange session so we can replace them
    const [lastPlacedFrameIds, setLastPlacedFrameIds] = useState<string[]>([]);
    const [hasAttempted, setHasAttempted] = useState(false);

    return (
        <SmartLayoutContext.Provider value={{
            config,
            setConfig,
            generateLayouts,
            isGenerating,
            solutions,
            cancelGeneration,
            progress,
            lastPlacedFrameIds,
            setLastPlacedFrameIds,
            hasAttempted,
            setHasAttempted
        }}>
            {children}
        </SmartLayoutContext.Provider>
    );
};

export const useSmartLayout = () => {
    const context = useContext(SmartLayoutContext);
    if (context === undefined) {
        throw new Error('useSmartLayout must be used within a SmartLayoutProvider');
    }
    return context;
};
