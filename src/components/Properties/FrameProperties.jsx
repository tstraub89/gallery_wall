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
        const updatedFrames = currentProject.frames.map(f => {
            if (selectedFrameIds.includes(f.id)) {
                return { ...f, [key]: value };
            }
            return f;
        });
        updateProject(currentProject.id, { frames: updatedFrames });
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

    return (
        <>
            <div className={styles.header}>
                <h3>Properties ({selectedFrames.length})</h3>
            </div>
            <div className={styles.content}>
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
            </div>
        </>
    );
};

export default FrameProperties;
