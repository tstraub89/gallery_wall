import React from 'react';
import { useImage } from '../../hooks/useImage';
import styles from './CanvasWorkspace.module.css'; // Reusing styles
import { Frame } from '../../types';

interface FrameContentProps {
    frame: Frame;
    ppi: number;
}

const FrameContent: React.FC<FrameContentProps> = ({ frame, ppi }) => {
    const { url } = useImage(frame.imageId ?? null);

    // Default PPI if not provided (fallback)
    const PPI = ppi || 10;

    // Border Width correction (defaults to 0 if not set in style, but CSS has 1px... 
    // We should probably treat 'undefined' as 'small' or handle it.
    // If we use PPI calculation, we need inches. 1px is approx 0.01 inch? Negligible?
    // Let's use the explicit value or 0.

    return (
        <div
            className={styles.frameContent}
            style={{
                userSelect: 'none',
                borderRadius: frame.shape === 'round' ? '50%' : '0'
            }}
        >
            {/* ... image ... */}

            {/* Empty State Label */}
            {!url && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${Math.max(6, Math.min(12, frame.width * PPI * 0.15))}px`,
                        color: '#999',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        textAlign: 'center',
                        width: '100%',
                        padding: '0 2px',
                        lineHeight: 1.2
                    }}
                >
                    {frame.label ? (
                        <span style={{ fontWeight: 600, color: '#555' }}>{frame.label}</span>
                    ) : (
                        <span>{frame.width}" x {frame.height}"</span>
                    )}
                </div>
            )}

            {/* Image Layer */}
            {url && (
                <img
                    src={url}
                    alt=""
                    draggable="false"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: `calc(50% + ${frame.imageState?.x || 0}px) calc(50% + ${frame.imageState?.y || 0}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        // Image Transforms
                        transform: `
                            scale(${frame.imageState?.scale || 1}) 
                            rotate(${frame.imageState?.rotation || 0}deg)
                        `,
                        borderRadius: frame.shape === 'round' ? '50%' : '0'
                    }}
                />
            )}

            {/* Matting Layer (Overlay) */}
            {frame.matted && (
                <div
                    className={styles.mattingOverlay}
                    style={{
                        zIndex: 2,
                        // Use Pixel values for borders.
                        // border-width does NOT support percentages.
                        // We use PPI passed from parent to convert inches to px.

                        borderLeftWidth: `${Math.max(0, (frame.width - frame.matted.width) / 2) * PPI}px`,
                        borderRightWidth: `${Math.max(0, (frame.width - frame.matted.width) / 2) * PPI}px`,
                        borderTopWidth: `${Math.max(0, (frame.height - frame.matted.height) / 2) * PPI}px`,
                        borderBottomWidth: `${Math.max(0, (frame.height - frame.matted.height) / 2) * PPI}px`,

                        borderStyle: 'solid',
                        borderColor: '#fff', // Mat color
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        boxSizing: 'border-box',
                        borderRadius: frame.shape === 'round' ? '50%' : '0',
                        overflow: 'hidden'
                    }}
                >
                    {/* Inner bevel shadow */}
                    <div style={{
                        width: '100%', height: '100%',
                        boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.3)',
                        borderRadius: frame.shape === 'round' ? '50%' : '0'
                    }} />
                </div>
            )}
        </div>
    );
};

export default FrameContent;
