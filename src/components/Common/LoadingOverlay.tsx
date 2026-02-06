import React from 'react';
import styles from './LoadingOverlay.module.css';

interface LoadingOverlayProps {
    message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.spinner}></div>
            <p>{message}</p>
        </div>
    );
};

export default LoadingOverlay;
