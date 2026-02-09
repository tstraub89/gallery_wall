import React from 'react';
import { useImage } from '../../hooks/useImage';
import { useViewport } from '../../context/ViewportContext';
import { TriangleAlert } from 'lucide-react';
import styles from './CanvasWorkspace.module.css'; // Reusing styles
import { Frame } from '../../types';
import { PPI as DEFAULT_PPI } from '../../constants';

interface FrameContentProps {
    frame: Frame;
    ppi: number;
}

const FrameContent: React.FC<FrameContentProps> = ({ frame, ppi }) => {
    const viewport = useViewport();
    const viewportScale = viewport?.scale ?? 1;

    // Choose optimal image tier based on on-screen pixels
    const imageInternalScale = frame.imageState?.scale || 1;
    const effectiveResolution = (ppi || DEFAULT_PPI) * viewportScale * imageInternalScale;
    const targetDim = Math.max(frame.width, frame.height) * effectiveResolution;

    // Use thumb (800px) if enough, otherwise preview (1600px)
    const type = targetDim <= 800 ? 'thumb' : 'preview';

    const { url, metadata } = useImage(frame.imageId ?? null, type);

    // Default PPI if not provided (fallback)
    const PPI = ppi || 10;

    // Calculate effective PPI if we have metrics and an image
    // PPI = (Natural Dimension / Frame Dimension in Inches) / Scale
    // We use the limiting dimension logic (usually width for landscape)
    let ppiColor = null;
    let ppiValue = 0;
    let targetPPI = 300;

    if (url && metadata && frame.width && frame.height) {
        const scale = frame.imageState?.scale || 1;
        const ppiW = metadata.width / frame.width;
        const ppiH = metadata.height / frame.height;

        // Since it covers, the displayed PPI is roughly the *smaller* ratio determined by the crop
        // The visible area is limited by the WORST dimension scaling
        ppiValue = Math.min(ppiW, ppiH) / scale;

        // Dynamic Threshold Logic
        // Small frames need higher PPI (viewed closer). large frames can have lower PPI.
        // Logic: <= 5" -> 300 PPI. >= 30" -> 150 PPI. Linear interpolate in between.
        const maxDim = Math.max(frame.width, frame.height);
        const MIN_DIM = 5;
        const MAX_DIM = 30;
        const MAX_PPI = 300;
        const MIN_PPI = 150;

        if (maxDim <= MIN_DIM) targetPPI = MAX_PPI;
        else if (maxDim >= MAX_DIM) targetPPI = MIN_PPI;
        else {
            const ratio = (maxDim - MIN_DIM) / (MAX_DIM - MIN_DIM);
            targetPPI = Math.round(MAX_PPI - (ratio * (MAX_PPI - MIN_PPI)));
        }

        // Critical Threshold Logic
        // We set a hard floor of 100 PPI for large prints (below that is visible pixelation even at distance).
        // For small prints, we stick to 50% of target (150 PPI).
        const critThreshold = Math.max(100, targetPPI * 0.5);

        if (ppiValue < critThreshold) ppiColor = '#ef4444'; // Red
        else if (ppiValue < targetPPI) ppiColor = '#fbbf24'; // Yellow
    }



    return (
        <div
            className={styles.frameContent}
            style={{
                userSelect: 'none',
                borderRadius: frame.shape === 'round' ? '50%' : '0',
                backgroundColor: url ? 'transparent' : '#fff',
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Warning Layer (Top Left) - Only if PPI is low and URL exists */}
            {ppiColor && (
                <div
                    style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        zIndex: 10,
                        color: ppiColor,
                        filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
                        pointerEvents: 'auto', // Allow hover
                        cursor: 'help'
                    }}
                    title={`Low Resolution: ~${Math.round(ppiValue)} PPI (Target ${targetPPI})`}
                >
                    <TriangleAlert size={16} fill="currentColor" stroke="#fff" strokeWidth={1.5} />
                </div>
            )}

            {/* Empty State Label */}
            {!url && (() => {
                // Determine visible area for text
                const displayW = frame.matted ? frame.matted.width : frame.width;
                const displayH = frame.matted ? frame.matted.height : frame.height;
                const displayText = frame.label || `${displayW}" x ${displayH}"`;

                // Hide text for very small openings to prevent clutter
                if (displayW < 3 || displayH < 3) {
                    return (
                        <div
                            title={displayText}
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                pointerEvents: 'auto', // Allow hover for tooltip
                                zIndex: 3
                            }}
                        />
                    );
                }

                return (
                    <div
                        title={displayText} // Tooltip for full text
                        style={{
                            position: 'absolute',
                            top: 0, left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            fontSize: `${Math.max(12, displayW * PPI * 0.2)}px`,
                            color: '#999',
                            textAlign: 'center',
                            lineHeight: 1.2,
                            zIndex: 3 // Ensure on top of mat borders if overlap occurs
                        }}
                    >
                        {frame.label ? (
                            <span style={{ fontWeight: 600, color: '#555' }}>{displayText}</span>
                        ) : (
                            <span>{displayText}</span>
                        )}
                    </div>
                );
            })()}

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

export default React.memo(FrameContent);
