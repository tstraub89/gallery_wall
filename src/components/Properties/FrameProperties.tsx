import React, { useMemo } from 'react';
import styles from './PropertiesPanel.module.css';
import { PPI } from '../../constants';
import ImageProperties from './ImageProperties';
import ValidatedNumberInput from '../Common/ValidatedNumberInput';
import {
    AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
    Trash2, RefreshCw
} from 'lucide-react';
import { Project, Frame, MatDimensions } from '../../types';
import { ProjectContextType } from '../../context/ProjectContextCore';

interface FramePropertiesProps {
    currentProject: Project;
    selectedFrameIds: string[];
    updateProject: ProjectContextType['updateProject'];
}

const FrameProperties: React.FC<FramePropertiesProps> = ({ currentProject, selectedFrameIds, updateProject }) => {
    // Memoize selected frames to ensure stability
    const selectedFrames = useMemo(() =>
        currentProject.frames.filter(f => selectedFrameIds.includes(f.id)),
        [currentProject.frames, selectedFrameIds]);

    const [activeTab, setActiveTab] = React.useState<'frame' | 'photo'>(() => {
        if (selectedFrames.length === 1 && selectedFrames[0].imageId) {
            return 'photo';
        }
        return 'frame';
    });

    // Force switch to frame tab if multiple selection (since we don't support multi-photo edit yet)
    React.useEffect(() => {
        if (selectedFrames.length > 1) {
            setActiveTab('frame');
        }
    }, [selectedFrames.length]);

    // CRITICAL SAFETY: If we have IDs but no matching frames found (e.g. just deleted)
    if (selectedFrames.length === 0) {
        return <div className={styles.empty}>No frames selected</div>;
    }

    const getValue = <K extends keyof Frame>(key: K): Frame[K] | '' => {
        if (selectedFrames.length === 0) return '';
        const first = selectedFrames[0][key];
        const allSame = selectedFrames.every(f => {
            if (typeof first === 'number') {
                const val = f[key] as number | undefined;
                return typeof val === 'number' && Math.abs(val - (first as number)) < 0.01;
            }
            return f[key] === first;
        });
        return (allSame ? first : '') as Frame[K] | '';
    };

    const updateAll = <K extends keyof Frame>(key: K, value: Frame[K]) => {
        const affectedTemplateIds = new Set<string>();
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                if (f.templateId) affectedTemplateIds.add(f.templateId);
                return { ...f, [key]: value };
            }
            return f;
        });

        // Sync back to library templates
        const updatedLibrary = currentProject.library.map(t => {
            if (affectedTemplateIds.has(t.id)) {
                return { ...t, [key]: value };
            }
            return t;
        });

        updateProject(currentProject.id, {
            frames: updatedFrames,
            library: updatedLibrary
        });
    };

    const minX = Math.min(...selectedFrames.map(f => f.x));
    const minY = Math.min(...selectedFrames.map(f => f.y));

    const updateRelative = (key: 'x' | 'y', newValue: number) => {
        const currentMin = key === 'x' ? minX : minY;
        const delta = newValue - currentMin;

        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                return { ...f, [key]: f[key] + delta };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    const align = (type: 'left' | 'right' | 'top' | 'bottom' | 'middle' | 'center') => {
        const updatedFrames = currentProject.frames.map(f => {
            if (!selectedFrameIds.includes(f.id)) return f;

            let newX = f.x;
            let newY = f.y;

            switch (type) {
                case 'left': newX = minX; break;
                case 'right': {
                    const maxR = Math.max(...selectedFrames.map(sf => sf.x + sf.width * PPI));
                    newX = maxR - f.width * PPI;
                    break;
                }
                case 'top': newY = minY; break;
                case 'bottom': {
                    const maxB = Math.max(...selectedFrames.map(sf => sf.y + sf.height * PPI));
                    newY = maxB - f.height * PPI;
                    break;
                }
                case 'middle': {
                    const minT = Math.min(...selectedFrames.map(sf => sf.y));
                    const maxB2 = Math.max(...selectedFrames.map(sf => sf.y + sf.height * PPI));
                    const mid = (minT + maxB2) / 2;
                    newY = mid - (f.height * PPI) / 2;
                    break;
                }
                case 'center': {
                    const minL = Math.min(...selectedFrames.map(sf => sf.x));
                    const maxR2 = Math.max(...selectedFrames.map(sf => sf.x + sf.width * PPI));
                    const horizMid = (minL + maxR2) / 2;
                    newX = horizMid - (f.width * PPI) / 2;
                    break;
                }
            }
            return { ...f, x: newX, y: newY };
        });
        updateProject(currentProject.id, { frames: updatedFrames });
    };

    // Helper for complex matting updates
    const isMatted = !!getValue('matted');
    const matDims = getValue('matted') as MatDimensions | null;

    const handleToggleMatted = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        if (checked) {
            // Default 1-inch mat
            const first = selectedFrames[0];
            updateAll('matted', {
                width: Math.max(0.5, first.width - 2),
                height: Math.max(0.5, first.height - 2)
            });
        } else {
            updateAll('matted', null);
        }
    };

    const handleMatDimChange = (field: keyof MatDimensions, val: number) => {
        const currentMat = matDims || { width: 0, height: 0 };
        updateAll('matted', { ...currentMat, [field]: val });
    };

    const rotateFrame = () => {
        const affectedTemplateIds = new Set();
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                if (f.templateId) affectedTemplateIds.add(f.templateId);

                const newMatted = f.matted ? {
                    width: f.matted.height,
                    height: f.matted.width
                } : null;

                return {
                    ...f,
                    width: f.height,
                    height: f.width,
                    matted: newMatted || f.matted // Keep null if was null
                };
            }
            return f;
        });

        // Sync back to library templates
        const updatedLibrary = currentProject.library.map(t => {
            if (affectedTemplateIds.has(t.id)) {
                const newMatted = t.matted ? {
                    width: t.matted.height,
                    height: t.matted.width
                } : null;

                return {
                    ...t,
                    width: t.height,
                    height: t.width,
                    matted: newMatted || t.matted
                };
            }
            return t;
        });

        updateProject(currentProject.id, {
            frames: updatedFrames,
            library: updatedLibrary
        });
    };

    const isPhotoTabDisabled = selectedFrames.length > 1;

    return (
        <>
            <div className={styles.header}>
                <h3>Properties ({selectedFrames.length})</h3>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'frame' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('frame')}
                >
                    Frame
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'photo' ? styles.activeTab : ''} ${isPhotoTabDisabled ? styles.disabledTab : ''}`}
                    onClick={() => !isPhotoTabDisabled && setActiveTab('photo')}
                    title={isPhotoTabDisabled ? "Select a single frame to edit photo" : "Photo Settings"}
                >
                    Photo
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'frame' && (
                    <>
                        <div className={styles.propGroup}>
                            <label>Label (Optional)</label>
                            <input
                                type="text"
                                value={getValue('label') || ''}
                                onChange={(e) => updateAll('label', e.target.value)}
                                placeholder={(selectedFrames.length === 1 && !selectedFrames[0].label) ? "e.g. 'Light Switch'" : ""}
                                className={styles.fluidInput}
                            />
                        </div>

                        <div className={styles.propGroup}>
                            <label>Position (X / Y)</label>
                            <div className={styles.row}>
                                <ValidatedNumberInput
                                    className={styles.fluidInput}
                                    step={0.1}
                                    value={Math.round((minX / PPI) * 10) / 10}
                                    onChange={(val) => updateRelative('x', val * PPI)}
                                    allowNegative={true}
                                />
                                <ValidatedNumberInput
                                    className={styles.fluidInput}
                                    step={0.1}
                                    value={Math.round((minY / PPI) * 10) / 10}
                                    onChange={(val) => updateRelative('y', val * PPI)}
                                    allowNegative={true}
                                />
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Dimensions (W x H)</label>
                            <div className={styles.row}>
                                <div className={styles.inputStack} style={{ flex: 1 }}>
                                    <ValidatedNumberInput
                                        className={styles.fluidInput}
                                        step={0.1}
                                        value={getValue('width') || ''}
                                        onChange={(val) => updateAll('width', val)}
                                        min={0.1}
                                        allowNegative={false}
                                        placeholder={selectedFrames.length > 1 ? "-" : ""}
                                    />
                                </div>
                                <div className={styles.inputStack} style={{ flex: 1 }}>
                                    <ValidatedNumberInput
                                        className={styles.fluidInput}
                                        step={0.1}
                                        value={getValue('height') || ''}
                                        onChange={(val) => updateAll('height', val)}
                                        min={0.1}
                                        allowNegative={false}
                                        placeholder={selectedFrames.length > 1 ? "-" : ""}
                                    />
                                </div>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={rotateFrame}
                                    title="Swap Width and Height"
                                    style={{ flex: 0, padding: '0 8px', minWidth: 'auto' }}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Alignment</label>
                            <div className={styles.row}>
                                <div className={styles.alignGroup}>
                                    <button className={styles.alignBtn} onClick={() => align('left')} title="Align Left">
                                        <AlignHorizontalJustifyStart size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('center')} title="Align Horizontal Center">
                                        <AlignHorizontalJustifyCenter size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('right')} title="Align Right">
                                        <AlignHorizontalJustifyEnd size={16} />
                                    </button>
                                </div>
                                <div className={styles.alignGroup}>
                                    <button className={styles.alignBtn} onClick={() => align('top')} title="Align Top">
                                        <AlignVerticalJustifyStart size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('middle')} title="Align Vertical Middle">
                                        <AlignVerticalJustifyCenter size={16} />
                                    </button>
                                    <button className={styles.alignBtn} onClick={() => align('bottom')} title="Align Bottom">
                                        <AlignVerticalJustifyEnd size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Frame Thickness</label>
                            <div className={styles.row}>
                                <input
                                    type="range" min="0" max="2" step="0.1"
                                    value={getValue('borderWidth') || 0.1}
                                    onChange={(e) => updateAll('borderWidth', parseFloat(e.target.value))}
                                    className={styles.slider}
                                />
                                <ValidatedNumberInput
                                    value={getValue('borderWidth') || 0.1}
                                    onChange={(val) => updateAll('borderWidth', val)}
                                    min={0}
                                    max={2}
                                    step={0.1}
                                    allowNegative={false}
                                    className={styles.numberInput}
                                />
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Shape</label>
                            <div className={styles.row}>
                                <select
                                    value={getValue('shape') || 'rect'}
                                    onChange={(e) => updateAll('shape', e.target.value)}
                                    className={styles.fluidInput}
                                >
                                    <option value="rect">Rectangular</option>
                                    <option value="round">Round / Oval</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <label>Frame Color</label>
                            <div className={styles.colorRow}>
                                {[
                                    { color: '#111111', title: 'Black' },
                                    { color: '#ffffff', title: 'White' },
                                    { color: '#5d4037', title: 'Wood' },
                                    { color: '#d4af37', title: 'Gold' },
                                    { color: '#9e9e9e', title: 'Silver' },
                                ].map((preset) => (
                                    <button
                                        key={preset.color}
                                        className={`${styles.colorSwatch} ${getValue('frameColor') === preset.color ? styles.activeSwatch : ''} `}
                                        style={{ backgroundColor: preset.color }}
                                        onClick={() => updateAll('frameColor', preset.color)}
                                        title={preset.title}
                                    />
                                ))}
                                <input
                                    type="color"
                                    value={getValue('frameColor') || '#111111'}
                                    onChange={(e) => updateAll('frameColor', e.target.value)}
                                    className={styles.colorPicker}
                                />
                            </div>
                        </div>

                        <div className={styles.propGroup}>
                            <div className={styles.row} style={{ justifyContent: 'flex-start', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="matted-toggle"
                                    checked={isMatted}
                                    onChange={handleToggleMatted}
                                />
                                <label htmlFor="matted-toggle">Matted?</label>
                            </div>
                            {isMatted && matDims && (
                                <div className={styles.row} style={{ marginTop: '4px', gap: '12px' }}>
                                    <div className={styles.inputStack}>
                                        <label>Opening W</label>
                                        <ValidatedNumberInput
                                            className={styles.fluidInput}
                                            step={0.1}
                                            value={matDims.width}
                                            onChange={(val) => handleMatDimChange('width', val)}
                                            min={0.1}
                                            allowNegative={false}
                                        />
                                    </div>
                                    <div className={styles.inputStack}>
                                        <label>Opening H</label>
                                        <ValidatedNumberInput
                                            className={styles.fluidInput}
                                            step={0.1}
                                            value={matDims.height}
                                            onChange={(val) => handleMatDimChange('height', val)}
                                            min={0.1}
                                            allowNegative={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'photo' && (
                    <>
                        {selectedFrames[0].imageId ? (
                            <ImageProperties
                                frame={selectedFrames[0]}
                                updateProject={updateProject}
                                currentProject={currentProject}
                            />
                        ) : (
                            <div className={styles.info} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                No photo selected.<br />
                                Drag a photo from the library to this frame to edit it.
                            </div>
                        )}
                    </>
                )}

                <button className={styles.deleteBtn} onClick={() => {
                    const updated = currentProject.frames.filter(f => !selectedFrameIds.includes(f.id));
                    updateProject(currentProject.id, { frames: updated });
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Trash2 size={14} />
                    <span>Remove {selectedFrames.length > 1 ? 'Frames' : 'Frame'} from Canvas</span>
                </button>
            </div >
        </>
    );
};

export default FrameProperties;
