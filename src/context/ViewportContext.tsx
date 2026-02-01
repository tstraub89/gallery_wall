import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ViewportState {
    scale: number;
    setScale: React.Dispatch<React.SetStateAction<number>>;
    pan: { x: number; y: number };
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

const ViewportContext = createContext<ViewportState | undefined>(undefined);

export const ViewportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    return (
        <ViewportContext.Provider value={{ scale, setScale, pan, setPan }}>
            {children}
        </ViewportContext.Provider>
    );
};

export const useViewport = () => {
    return useContext(ViewportContext);
};
