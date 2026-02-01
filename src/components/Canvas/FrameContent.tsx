import React from 'react';
import { useImage } from '../../hooks/useImage';
import { TriangleAlert } from 'lucide-react';
import styles from './CanvasWorkspace.module.css'; // Reusing styles
import { Frame } from '../../types';

interface FrameContentProps {
    frame: Frame;
    ppi: number;
}

const FrameContent: React.FC<FrameContentProps> = ({ frame, ppi }) => {
    const { url } = useImage(frame.imageId ?? null);
    const [metrics, setMetrics] = React.useState<{ w: number, h: number } | null>(null);

    // Default PPI if not provided (fallback)
    const PPI = ppi || 10;

    // Calculate effective PPI if we have metrics and an image
    // PPI = (Natural Dimension / Frame Dimension in Inches) / Scale
    // We use the limiting dimension logic (usually width for landscape)
    let ppiColor = null;
    let ppiValue = 0;

    if (url && metrics && frame.width && frame.height) {
        // Determine which dimension is "binding" is complex due to object-fit: cover.
        // But a safe approximation for "quality" is the minimum ratio.
        // If I have a huge 5000px wide image in a 1 inch frame, PPI is huge.
        // If I have a 10px wide image in a 10 inch frame, PPI is 1.
        // We check both W and H ratios.
        const scale = frame.imageState?.scale || 1;
        const ppiW = metrics.w / frame.width;
        const ppiH = metrics.h / frame.height;

        // Since it covers, the displayed PPI is roughly the *smaller* ratio determined by the crop?
        // No, 'Cover' uses the LARGER scale factor to fill.
        // So effective source pixels used is determined by the dimension that fits exactly.
        // Which means the *smaller* PPI of the two dimensions is the effective one across the print?
        // Actually, if 5000px W fits 10in W (500 PPI). And 10px H fits 10in H (1 PPI).
        // Cover will scale to make H fit. W will be cropped.
        // The visible area has 1 PPI vertical resolution. 500 PPI horizontal.
        // So quality is limited by the WORST dimension.
        ppiValue = Math.min(ppiW, ppiH) / scale;

        if (ppiValue < 150) ppiColor = '#ef4444'; // Red
        else if (ppiValue < 300) ppiColor = '#fbbf24'; // Yellow
    }

    // Reset metrics if url changes (basic check, though key changes usually handle this)
    React.useEffect(() => {
        if (!url) setMetrics(null);
    }, [url]);

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
                    title={`Low Resolution: ~${Math.round(ppiValue)} PPI (Target 300)`}
                >
                    <TriangleAlert size={16} fill="currentColor" stroke="#fff" strokeWidth={1.5} />
                </div>
            )}

            {/* Empty State Label */}
            {!url && (
                <div
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
                        fontSize: `${Math.max(10, frame.width * PPI * 0.12)}px`,
                        color: '#999',
                        textAlign: 'center',
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
                    onLoad={(e) => setMetrics({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
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
