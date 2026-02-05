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

    // Future-proofing: If user has paid, hide the badge
    if (isPro) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        openProModal();
    };

    return (
        <span 
            className={`${styles.badge} ${isOverlay ? styles.overlay : ''} ${className || ''}`}
            onClick={handleClick}
            title="Pro Feature (Click to learn more)"
            style={style}
        >
            PRO
        </span>
    );
};

export default ProBadge;
