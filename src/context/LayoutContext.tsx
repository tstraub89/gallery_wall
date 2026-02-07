import { useState, ReactNode } from 'react';
import { LayoutContext } from './LayoutContextCore';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
    const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    // Persist sidebar width, default to 340 (matching CSS)
    const [sidebarWidth, setSidebarWidth] = useLocalStorage('gallery_sidebar_width', 340);

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
