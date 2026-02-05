import React from 'react';
import { useProModal } from '../../context/ProContext';
import styles from './ProBadge.module.css';

interface ProBadgeProps {
    className?: string;
    isOverlay?: boolean;
    style?: React.CSSProperties;
}

const ProBadge: React.FC<ProBadgeProps> = ({ className, isOverlay, style }) => {
    const { openProModal, isPro } = useProModal();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openProModal();
    };

    return (
        <span 
            className={`${styles.badge} ${isOverlay ? styles.overlay : ''} ${className || ''}`}
            onClick={handleClick}
            title={isPro ? "Premium Feature (Unlocked)" : "Pro Feature (Click to learn more)"}
            style={style}
        >
            PRO
        </span>
    );
};

export default ProBadge;
