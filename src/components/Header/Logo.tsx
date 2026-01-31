import React from 'react';
import styles from './Logo.module.css';

const Logo: React.FC = () => {
    return (
        <div className={styles.logo}>
            <div className={styles.icon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            </div>
            <div className={styles.text}>
                <span className={styles.bold}>Gallery</span>
                <span className={styles.light}>Planner</span>
            </div>
        </div>
    );
};

export default Logo;
