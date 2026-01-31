import React from 'react';
import styles from './PropertiesPanel.module.css';
import ValidatedNumberInput from '../Common/ValidatedNumberInput';
import { RotateCw, ImageMinus } from 'lucide-react';
import { Frame, Project, ImageState } from '../../types';
import { ProjectContextType } from '../../context/ProjectContextCore';

interface ImagePropertiesProps {
    frame: Frame;
    currentProject: Project;
    updateProject: ProjectContextType['updateProject'];
}

const ImageProperties: React.FC<ImagePropertiesProps> = ({ frame, updateProject, currentProject }) => {
    const handleImageChange = (field: keyof ImageState, value: number) => {
        const currentImageState = frame.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
        const updatedFrames = currentProject.frames.map(f =>
            f.id === frame.id ? { ...f, imageState: { ...currentImageState, [field]: value } } : f
        );
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    return (
        <>
            <div className={styles.propGroup}>
                <label>Scale</label>
                <div className={styles.row}>
                    <input
                        type="range" min="0.1" max="3" step="0.1"
                        value={frame.imageState?.scale || 1}
                        onChange={(e) => handleImageChange('scale', parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                    <ValidatedNumberInput
                        value={frame.imageState?.scale || 1}
                        onChange={(val) => handleImageChange('scale', val)}
                        min={0.1}
                        step={0.1}
                        allowNegative={false}
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
                    <ValidatedNumberInput
                        value={frame.imageState?.x || 0}
                        onChange={(val) => handleImageChange('x', val)}
                        allowNegative={true}
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
                    <ValidatedNumberInput
                        value={frame.imageState?.y || 0}
                        onChange={(val) => handleImageChange('y', val)}
                        allowNegative={true}
                        className={styles.numberInput}
                    />
                </div>
            </div>
            <div className={styles.propGroup}>
                <button
                    className={styles.secondaryBtn}
                    onClick={() => handleImageChange('rotation', ((frame.imageState?.rotation || 0) + 90) % 360)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <RotateCw size={14} />
                    <span>Rotate 90°</span>
                </button>
            </div>
            <div className={styles.propGroup}>
                <button
                    className={styles.removeImageBtn}
                    onClick={() => {
                        const updated = currentProject.frames.map(f =>
                            f.id === frame.id ? { ...f, imageId: null, imageState: null } : f
                        );
                        updateProject(currentProject.id, { frames: updated });
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <ImageMinus size={14} />
                    <span>Remove Image</span>
                </button>
            </div>
        </>
    );
};

export default ImageProperties;
