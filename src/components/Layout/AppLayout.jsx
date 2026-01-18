import React from 'react';
import styles from './AppLayout.module.css';

export const AppLayout = ({ children }) => {
    return (
        <div className={styles.container}>
            {children}
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
