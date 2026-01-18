import React from 'react';
import { useImage } from '../../hooks/useImage';
import styles from './CanvasWorkspace.module.css'; // Reusing styles

const FrameContent = ({ frame }) => {
    const imageUrl = useImage(frame.imageId);

    return (
        <div className={styles.frameContent}>
            {/* If matted, the image is 'inside' the matting window. 
                Visually, we can render the image BEHIND the matting div? 
                Or render the Matting div with a 'window' using border?
                A simpler CSS approach for matting:
                Matting Div is absolute, has borders equal to the mat width. 
                Center is transparent. 
                Image is behind it.
            */}

            {/* Empty State Label */}
            {!imageUrl && (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '10px',
                        color: '#999',
                        pointerEvents: 'none'
                    }}
                >
                    {frame.width}" x {frame.height}"
                </div>
            )}

            {/* Image Layer */}
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 1,
                        // Image Transforms
                        transform: `
                            scale(${frame.imageState?.scale || 1}) 
                            translate(${frame.imageState?.x || 0}px, ${frame.imageState?.y || 0}px) 
                            rotate(${frame.imageState?.rotation || 0}deg)
                        `
                    }}
                />
            )}

            {/* Matting Layer (Overlay) */}
            {frame.matted && (
                <div
                    className={styles.mattingOverlay}
                    style={{
                        zIndex: 2,
                        // We want a hole in the middle.
                        // We can use a huge border with a transparent center? 
                        // Or box-shadow based cutout.
                        // Or easy way: 4 rects (top, bottom, left, right).
                        // Let's use the Border trick.
                        // Parent (frame) matches outer dimensions.
                        // We need to calculate border widths.
                        // frame.width (outer) vs frame.matted.width (inner).
                        // borderX = (outerW - innerW) / 2

                        // If we use %, we need relative to container.
                        // borderLeft = ( (W - w_inner) / 2 ) / W * 100 %

                        borderLeftWidth: `${((frame.width - frame.matted.width) / 2 / frame.width) * 100}%`,
                        borderRightWidth: `${((frame.width - frame.matted.width) / 2 / frame.width) * 100}%`,
                        borderTopWidth: `${((frame.height - frame.matted.height) / 2 / frame.height) * 100}%`,
                        borderBottomWidth: `${((frame.height - frame.matted.height) / 2 / frame.height) * 100}%`,

                        borderStyle: 'solid',
                        borderColor: '#fff', // Mat color
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Inner bevel shadow */}
                    <div style={{
                        width: '100%', height: '100%',
                        boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.3)'
                    }} />
                </div>
            )}
        </div>
    );
};

export default FrameContent;
