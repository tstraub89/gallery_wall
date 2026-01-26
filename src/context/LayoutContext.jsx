import React, { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(250);

    const toggleLeftSidebar = () => setIsLeftSidebarOpen(prev => !prev);
    const toggleRightSidebar = () => setIsRightSidebarOpen(prev => !prev);

    return (
        <LayoutContext.Provider
            value={{
                isLeftSidebarOpen,
                isRightSidebarOpen,
                toggleLeftSidebar,
                toggleRightSidebar,
                setIsLeftSidebarOpen,
                setIsRightSidebarOpen,
                sidebarWidth,
                setSidebarWidth
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
