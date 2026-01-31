import { createContext, Dispatch, SetStateAction } from 'react';

export interface LayoutContextType {
    isLeftSidebarOpen: boolean;
    isRightSidebarOpen: boolean;
    sidebarWidth: number;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setIsLeftSidebarOpen: Dispatch<SetStateAction<boolean>>;
    setIsRightSidebarOpen: Dispatch<SetStateAction<boolean>>;
    setSidebarWidth: Dispatch<SetStateAction<number>>;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);
