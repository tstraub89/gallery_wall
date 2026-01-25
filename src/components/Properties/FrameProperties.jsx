import React, { useMemo } from 'react';
import styles from './PropertiesPanel.module.css';
import { PPI } from '../../constants';
import ImageProperties from './ImageProperties';

const FrameProperties = ({ currentProject, selectedFrameIds, updateProject }) => {
    // Memoize selected frames to ensure stability
    const selectedFrames = useMemo(() =>
        currentProject.frames.filter(f => selectedFrameIds.includes(f.id)),
        [currentProject.frames, selectedFrameIds]);

    // CRITICAL SAFETY: If we have IDs but no matching frames found (e.g. just deleted)
    if (selectedFrames.length === 0) {
        return <div className={styles.empty}>No frames selected</div>;
    }

    const getValue = (key) => {
        if (selectedFrames.length === 0) return '';
        const first = selectedFrames[0][key];
        const allSame = selectedFrames.every(f => {
            if (typeof first === 'number') {
                return Math.abs(f[key] - (first || 0)) < 0.01;
            }
            return f[key] === first;
        });
        return allSame ? first : '';
    };

    const updateAll = (key, value) => {
        const affectedTemplateIds = new Set();
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

    const updateRelative = (key, newValue) => {
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

    const align = (type) => {
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
    const matDims = getValue('matted');

    const handleToggleMatted = (e) => {
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

    const handleMatDimChange = (field, val) => {
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

    return (
        <>
            <div className={styles.header}>
                <h3>Properties ({selectedFrames.length})</h3>
            </div>
            <div className={styles.content}>
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
                        <input
                            className={styles.fluidInput}
                            type="number" step="0.1"
                            value={(minX / PPI).toFixed(2)}
                            onChange={(e) => updateRelative('x', parseFloat(e.target.value) * PPI)}
                        />
                        <input
                            className={styles.fluidInput}
                            type="number" step="0.1"
                            value={(minY / PPI).toFixed(2)}
                            onChange={(e) => updateRelative('y', parseFloat(e.target.value) * PPI)}
                        />
                    </div>
                </div>

                <div className={styles.propGroup}>
                    <label>Dimensions (W x H)</label>
                    <div className={styles.row}>
                        <div className={styles.inputStack} style={{ flex: 1 }}>
                            <input
                                className={styles.fluidInput}
                                type="number" step="0.1"
                                value={getValue('width') || ''}
                                onChange={(e) => updateAll('width', parseFloat(e.target.value))}
                                placeholder={selectedFrames.length > 1 ? "-" : ""}
                            />
                        </div>
                        <div className={styles.inputStack} style={{ flex: 1 }}>
                            <input
                                className={styles.fluidInput}
                                type="number" step="0.1"
                                value={getValue('height') || ''}
                                onChange={(e) => updateAll('height', parseFloat(e.target.value))}
                                placeholder={selectedFrames.length > 1 ? "-" : ""}
                            />
                        </div>
                        <button
                            className={styles.secondaryBtn}
                            onClick={rotateFrame}
                            title="Swap Width and Height"
                            style={{ flex: 0, padding: '0 8px', minWidth: 'auto' }}
                        >
                            <span style={{ fontSize: '1.2em' }}>↻</span>
                        </button>
                    </div>
                </div>

                <div className={styles.propGroup}>
                    <label>Alignment</label>
                    <div className={styles.row}>
                        <button onClick={() => align('left')} title="Align Left">L</button>
                        <button onClick={() => align('center')} title="Align Center">C</button>
                        <button onClick={() => align('right')} title="Align Right">R</button>
                        <span style={{ width: 8 }} />
                        <button onClick={() => align('top')} title="Align Top">T</button>
                        <button onClick={() => align('middle')} title="Align Middle">M</button>
                        <button onClick={() => align('bottom')} title="Align Bottom">B</button>
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
                        <input
                            type="number" step="0.1"
                            value={getValue('borderWidth') || 0.1}
                            onChange={(e) => updateAll('borderWidth', parseFloat(e.target.value))}
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
                                className={`${styles.colorSwatch} ${getValue('frameColor') === preset.color ? styles.activeSwatch : ''}`}
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
                                <input
                                    className={styles.fluidInput}
                                    type="number" step="0.1"
                                    value={matDims.width}
                                    onChange={(e) => handleMatDimChange('width', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className={styles.inputStack}>
                                <label>Opening H</label>
                                <input
                                    className={styles.fluidInput}
                                    type="number" step="0.1"
                                    value={matDims.height}
                                    onChange={(e) => handleMatDimChange('height', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {selectedFrames.length === 1 && (
                    <>
                        <hr className={styles.divider} />
                        {selectedFrames[0].imageId && (
                            <ImageProperties
                                frame={selectedFrames[0]}
                                updateProject={updateProject}
                                currentProject={currentProject}
                            />
                        )}
                    </>
                )}

                <button className={styles.deleteBtn} onClick={() => {
                    const updated = currentProject.frames.filter(f => !selectedFrameIds.includes(f.id));
                    updateProject(currentProject.id, { frames: updated });
                }}>Remove {selectedFrames.length > 1 ? 'Frames' : 'Frame'} from Canvas</button>
            </div >
        </>
    );
};

export default FrameProperties;
