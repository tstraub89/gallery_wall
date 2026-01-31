import { useState, ReactNode } from 'react';
import { LayoutContext } from './LayoutContextCore';

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(280);

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
