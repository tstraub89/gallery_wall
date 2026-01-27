import React, { useState, useEffect } from 'react';
import styles from './AppLayout.module.css';

import { useLayout } from '../../hooks/useLayout';

export const AppLayout = ({ children }) => {
    const [isResizing, setIsResizing] = useState(false);
    const { isLeftSidebarOpen, isRightSidebarOpen, sidebarWidth, setSidebarWidth } = useLayout();

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                // Min width 200, Max width 600
                const newWidth = Math.min(Math.max(200, e.clientX), 600);
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
            }}
        >
            {children}
            {isLeftSidebarOpen && (
                <div
                    className={styles.resizeHandle}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                />
            )}
        </div>
    );
};

export const Header = ({ children }) => (
    <header className={styles.header}>{children}</header>
);

export const LeftSidebar = ({ children }) => (
    <aside className={styles.leftSidebar}>{children}</aside>
);

export const MainCanvas = ({ children }) => (
    <main className={styles.mainCanvas}>{children}</main>
);

export const RightSidebar = ({ children }) => (
    <aside className={styles.rightSidebar}>{children}</aside>
);
