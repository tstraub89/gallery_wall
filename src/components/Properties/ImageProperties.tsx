import React from 'react';
import styles from './PropertiesPanel.module.css';
import ValidatedNumberInput from '../Common/ValidatedNumberInput';
import { RotateCw, ImageMinus } from 'lucide-react';
import { Frame, Project, ImageState } from '../../types';
import { ProjectContextType } from '../../context/ProjectContextCore';

interface ImagePropertiesProps {
    frames: Frame[];  // Now accepts multiple frames
    currentProject: Project;
    updateProject: ProjectContextType['updateProject'];
}

const ImageProperties: React.FC<ImagePropertiesProps> = ({ frames, updateProject, currentProject }) => {
    // Filter to only frames with photos
    const framesWithPhotos = frames.filter(f => f.imageId);

    if (framesWithPhotos.length === 0) {
        return (
            <div className={styles.info} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                No photos in selected frames.<br />
                Drag photos from the library to add them.
            </div>
        );
    }

    // Helper to get common value across all frames (or show mixed state)
    const getImageValue = (field: keyof ImageState): number | '' => {
        const values = framesWithPhotos.map(f => f.imageState?.[field] ?? (field === 'scale' ? 1 : 0));
        const first = values[0];
        const allSame = values.every(v => Math.abs(v - first) < 0.01);
        return allSame ? first : '';
    };

    // Update all selected frames with photos
    const handleImageChange = (field: keyof ImageState, value: number) => {
        const frameIds = new Set(framesWithPhotos.map(f => f.id));
        const updatedFrames = currentProject.frames.map(f => {
            if (frameIds.has(f.id) && f.imageId) {
                const currentImageState = f.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
                return { ...f, imageState: { ...currentImageState, [field]: value } };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    // Rotate all photos 90 degrees
    const handleRotateAll = () => {
        const frameIds = new Set(framesWithPhotos.map(f => f.id));
        const updatedFrames = currentProject.frames.map(f => {
            if (frameIds.has(f.id) && f.imageId) {
                const currentImageState = f.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
                return { ...f, imageState: { ...currentImageState, rotation: (currentImageState.rotation + 90) % 360 } };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    // Remove photos from all selected frames
    const handleRemovePhotos = () => {
        const frameIds = new Set(framesWithPhotos.map(f => f.id));
        const updatedFrames = currentProject.frames.map(f => {
            if (frameIds.has(f.id)) {
                return { ...f, imageId: null, imageState: null };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const isMultiple = framesWithPhotos.length > 1;
    const scaleValue = getImageValue('scale');
    const xValue = getImageValue('x');
    const yValue = getImageValue('y');

    return (
        <>
            {isMultiple && (
                <div className={styles.info} style={{ textAlign: 'center', padding: '8px', color: '#888', fontSize: '12px' }}>
                    Editing {framesWithPhotos.length} photos
                </div>
            )}
            <div className={styles.propGroup}>
                <label>Scale</label>
                <div className={styles.row}>
                    <input
                        type="range" min="0.1" max="3" step="0.1"
                        value={typeof scaleValue === 'number' ? scaleValue : 1}
                        onChange={(e) => handleImageChange('scale', parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                    <ValidatedNumberInput
                        value={scaleValue}
                        onChange={(val) => handleImageChange('scale', val)}
                        min={0.1}
                        step={0.1}
                        allowNegative={false}
                        className={styles.numberInput}
                        placeholder={isMultiple && scaleValue === '' ? '-' : ''}
                    />
                </div>
            </div>
            <div className={styles.propGroup}>
                <label>Position X</label>
                <div className={styles.row}>
                    <input
                        type="range" min="-500" max="500"
                        value={typeof xValue === 'number' ? xValue : 0}
                        onChange={(e) => handleImageChange('x', parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                    <ValidatedNumberInput
                        value={xValue}
                        onChange={(val) => handleImageChange('x', val)}
                        allowNegative={true}
                        className={styles.numberInput}
                        placeholder={isMultiple && xValue === '' ? '-' : ''}
                    />
                </div>
            </div>
            <div className={styles.propGroup}>
                <label>Position Y</label>
                <div className={styles.row}>
                    <input
                        type="range" min="-500" max="500"
                        value={typeof yValue === 'number' ? yValue : 0}
                        onChange={(e) => handleImageChange('y', parseFloat(e.target.value))}
                        className={styles.slider}
                    />
                    <ValidatedNumberInput
                        value={yValue}
                        onChange={(val) => handleImageChange('y', val)}
                        allowNegative={true}
                        className={styles.numberInput}
                        placeholder={isMultiple && yValue === '' ? '-' : ''}
                    />
                </div>
            </div>
            <div className={styles.propGroup}>
                <button
                    className={styles.secondaryBtn}
                    onClick={handleRotateAll}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <RotateCw size={14} />
                    <span>Rotate {isMultiple ? `${framesWithPhotos.length} Photos` : ''} 90°</span>
                </button>
            </div>
            <div className={styles.propGroup}>
                <button
                    className={styles.removeImageBtn}
                    onClick={handleRemovePhotos}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                    <ImageMinus size={14} />
                    <span>Remove {isMultiple ? `${framesWithPhotos.length} Photos` : 'Photo'}</span>
                </button>
            </div>
        </>
    );
};

export default ImageProperties;
