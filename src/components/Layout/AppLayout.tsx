import React, { useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './AppLayout.module.css';

import { useLayout } from '../../hooks/useLayout';

interface AppLayoutProps {
    children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [isResizing, setIsResizing] = useState(false);
    const { isLeftSidebarOpen, isRightSidebarOpen, sidebarWidth, setSidebarWidth, toggleLeftSidebar, toggleRightSidebar } = useLayout();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                // Min width 260, Max width 1400 (for ultrawide)
                const newWidth = Math.min(Math.max(260, e.clientX), 1400);
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, setSidebarWidth]);

    return (
        <div
            className={styles.container}
            style={{
                '--sidebar-width': isLeftSidebarOpen ? `${sidebarWidth}px` : '0px',
                '--properties-width': isRightSidebarOpen ? '300px' : '0px'
            } as React.CSSProperties}
        >
            {children}

            {/* Left Toggle Handle */}
            <button
                className={`${styles.toggleHandle} ${styles.leftHandle}`}
                onClick={toggleLeftSidebar}
                title={isLeftSidebarOpen ? "Collapse Library" : "Expand Library"}
            >
                <ChevronRight
                    size={14}
                    className={styles.handleIcon}
                    style={{ transform: isLeftSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {/* Right Toggle Handle */}
            <button
                className={`${styles.toggleHandle} ${styles.rightHandle}`}
                onClick={toggleRightSidebar}
                title={isRightSidebarOpen ? "Collapse Properties" : "Expand Properties"}
            >
                <ChevronLeft
                    size={14}
                    className={styles.handleIcon}
                    style={{ transform: isRightSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </button>

            {isLeftSidebarOpen && (
                <div
                    className={styles.resizeHandle}
                    onMouseDown={(e: React.MouseEvent) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                />
            )}
        </div>
    );
};

export const Header = ({ children }: { children: ReactNode }) => (
    <header className={styles.header}>{children}</header>
);

export const LeftSidebar = ({ children }: { children: ReactNode }) => (
    <aside className={styles.leftSidebar}>{children}</aside>
);

export const MainCanvas = ({ children }: { children: ReactNode }) => (
    <main className={styles.mainCanvas}>{children}</main>
);

export const RightSidebar = ({ children }: { children: ReactNode }) => (
    <aside className={styles.rightSidebar}>{children}</aside>
);
