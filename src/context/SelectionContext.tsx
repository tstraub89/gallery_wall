import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define the shape of the Selection Context
export interface SelectionContextType {
    selectedFrameIds: string[];
    selectedImageIds: string[];
    selectedFrameTemplateIds: string[];
    focusedArea: 'canvas' | 'library' | null;

    selectFrame: (frameId: string, multi?: boolean) => void;
    setSelection: (ids: string[]) => void;
    setSelectedImages: (ids: string[]) => void;
    setSelectedFrameTemplates: (ids: string[]) => void;
    setFocusedArea: (area: 'canvas' | 'library' | null) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([]);
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const [selectedFrameTemplateIds, setSelectedFrameTemplateIds] = useState<string[]>([]);
    const [focusedArea, setFocusedAreaState] = useState<'canvas' | 'library' | null>(null);

    const selectFrame = useCallback((frameId: string, multi = false) => {
        setSelectedFrameIds(prev => {
            if (multi) {
                if (prev.includes(frameId)) {
                    return prev.filter(id => id !== frameId);
                }
                return [...prev, frameId];
            }
            return frameId ? [frameId] : [];
        });
    }, []);

    const setSelection = useCallback((ids: string[]) => {
        setSelectedFrameIds(ids);
    }, []);

    const setSelectedImages = useCallback((ids: string[]) => {
        setSelectedImageIds(ids);
    }, []);

    const setSelectedFrameTemplates = useCallback((ids: string[]) => {
        setSelectedFrameTemplateIds(ids);
    }, []);

    const setFocusedArea = useCallback((area: 'canvas' | 'library' | null) => {
        setFocusedAreaState(area);
    }, []);

    return (
        <SelectionContext.Provider value={{
            selectedFrameIds,
            selectedImageIds,
            selectedFrameTemplateIds,
            focusedArea,
            selectFrame,
            setSelection,
            setSelectedImages,
            setSelectedFrameTemplates,
            setFocusedArea
        }}>
            {children}
        </SelectionContext.Provider>
    );
};

export const useSelection = () => {
    const context = useContext(SelectionContext);
    if (context === undefined) {
        throw new Error('useSelection must be used within a SelectionProvider');
    }
    return context;
};
