import React, { useState, useEffect } from 'react';
import styles from './AppLayout.module.css';

export const AppLayout = ({ children }) => {
    const [sidebarWidth, setSidebarWidth] = useState(250);
    const [isResizing, setIsResizing] = useState(false);

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
    }, [isResizing]);

    return (
        <div
            className={styles.container}
            style={{ '--sidebar-width': `${sidebarWidth}px` }}
        >
            {children}
            {/* Drag Handle overlaid or inserted? 
                The grid layout expects specific children. 
                We can insert the handle as a child, but we need to position it correctly.
                Actually, dragging the border of the sidebar is better.
                Let's pass the resize handle capability to the Sidebar or position absolute?
            */}
            <div
                className={styles.resizeHandle}
                onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                }}
            />
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
