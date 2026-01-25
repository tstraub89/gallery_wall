import React from 'react';
import styles from './PropertiesPanel.module.css';

const ImageProperties = ({ frame, updateProject, currentProject }) => {
    const handleImageChange = (field, value) => {
        const currentImageState = frame.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
        const updatedFrames = currentProject.frames.map(f =>
            f.id === frame.id ? { ...f, imageState: { ...currentImageState, [field]: value } } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    return (
        <>
            <div className={styles.header} style={{ paddingLeft: 0 }}><h3>Image Settings</h3></div>
            <div className={styles.propGroup}>
                <label>Scale</label>
                <div className={styles.row}>
                    <input
                        type="range" min="0.1" max="3" step="0.1"
                        value={frame.imageState?.scale || 1}
                        onChange={(e) => handleImageChange('scale', parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                    <input
                        type="number" step="0.1"
                        value={frame.imageState?.scale || 1}
                        onChange={(e) => handleImageChange('scale', parseFloat(e.target.value))}
                        className={styles.numberInput}
                    />
                </div>
            </div>
            <div className={styles.propGroup}>
                <label>Position X</label>
                <div className={styles.row}>
                    <input
                        type="range" min="-500" max="500"
                        value={frame.imageState?.x || 0}
                        onChange={(e) => handleImageChange('x', parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                    <input
                        type="number"
                        value={frame.imageState?.x || 0}
                        onChange={(e) => handleImageChange('x', parseFloat(e.target.value))}
                        className={styles.numberInput}
                    />
                </div>
            </div>
            <div className={styles.propGroup}>
                <label>Position Y</label>
                <div className={styles.row}>
                    <input
                        type="range" min="-500" max="500"
                        value={frame.imageState?.y || 0}
                        onChange={(e) => handleImageChange('y', parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                    <input
                        type="number"
                        value={frame.imageState?.y || 0}
                        onChange={(e) => handleImageChange('y', parseFloat(e.target.value))}
                        className={styles.numberInput}
                    />
                </div>
            </div>
            <div className={styles.propGroup}>
                <label>Image Rotation</label>
                <button
                    className={styles.secondaryBtn}
                    onClick={() => handleImageChange('rotation', ((frame.imageState?.rotation || 0) + 90) % 360)}
                >
                    Rotate Image 90°
                </button>
            </div>
            <div className={styles.propGroup}>
                <button className={styles.secondaryBtn} onClick={() => {
                    const updated = currentProject.frames.map(f =>
                        f.id === frame.id ? { ...f, imageId: null, imageState: null } : f
                    );
                    updateProject(currentProject.id, { frames: updated });
                }}>Remove Image</button>
            </div>
        </>
    );
};

export default ImageProperties;
