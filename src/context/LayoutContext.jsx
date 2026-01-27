import React, { useState } from 'react';
import { LayoutContext } from './LayoutContextCore';

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
