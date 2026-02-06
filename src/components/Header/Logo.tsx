import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useProModal } from '../../context/ProContext';
import styles from './Logo.module.css';

interface LogoProps {
    hideStatus?: boolean;
    scale?: number;
}

const Logo: React.FC<LogoProps> = ({ hideStatus = false, scale = 1 }) => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { isPro, isBeta, openProModal } = useProModal();

    const getStatusInfo = () => {
        if (isBeta) return { label: 'BETA', className: styles.beta };
        if (isPro) return { label: 'PRO', className: styles.pro };
        return { label: 'FREE', className: styles.free };
    };

    const status = getStatusInfo();

    return (
        <div
            className={styles.logo}
            title="Early beta - core features are free while I build this out"
            style={{
                transform: `scale(${scale})`,
                transformOrigin: 'left center'
            }}
        >
            <div className={styles.icon} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            </div>
            <div className={styles.text} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                <span className={styles.bold}>Gallery</span>
                <span className={styles.light}>Planner</span>
            </div>
            {!isMobile && !hideStatus && (
                <span
                    className={status.className}
                    onClick={(e) => {
                        e.stopPropagation();
                        openProModal();
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {status.label}
                </span>
            )}
        </div>
    );
};

export default Logo;
