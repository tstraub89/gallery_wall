import React, { useMemo } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './PropertiesPanel.module.css';
import { PPI } from '../../constants';

const PropertiesPanel = () => {
    const { currentProject, selectedFrameIds, updateProject } = useProject();

    if (!currentProject) {
        return <div className={styles.empty}>Select a project</div>;
    }

    const hasSelection = selectedFrameIds.length > 0;

    return (
        <div className={styles.container}>
            {hasSelection ? (
                <FrameProps
                    currentProject={currentProject}
                    selectedFrameIds={selectedFrameIds}
                    updateProject={updateProject}
                />
            ) : (
                <WallProps
                    currentProject={currentProject}
                    updateProject={updateProject}
                />
            )}
        </div>
    );
};

// --- Frame Properties Component ---
const FrameProps = ({ currentProject, selectedFrameIds, updateProject }) => {
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
        const allSame = selectedFrames.every(f => Math.abs(f[key] - (first || 0)) < 0.01);
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
                            type="number" step="0.1"
                            value={(minX / PPI).toFixed(2)}
                            onChange={(e) => updateRelative('x', parseFloat(e.target.value) * PPI)}
                        />
                        <input
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

                {selectedFrames.length === 1 && (
                    <>
                        <hr className={styles.divider} />
                        {selectedFrames[0].imageId && (
                            <SingleImageControls
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

// --- Wall Properties Component ---
const WallProps = ({ currentProject, updateProject }) => {
    const wall = currentProject.wallConfig;
    const handleWallChange = (field, value) => {
        updateProject(currentProject.id, { wallConfig: { ...wall, [field]: value } });
    };

    return (
        <>
            <div className={styles.header}><h3>Wall Settings</h3></div>
            <div className={styles.content}>
                <div className={styles.propGroup}>
                    <label>Wall Name</label>
                    <input type="text" value={currentProject.name} onChange={(e) => updateProject(currentProject.id, { name: e.target.value })} />
                </div>
                <div className={styles.propGroup}>
                    <label>Dimensions (WxH)</label>
                    <div className={styles.row}>
                        <input type="number" value={wall.width} onChange={(e) => handleWallChange('width', parseFloat(e.target.value))} />
                        <input type="number" value={wall.height} onChange={(e) => handleWallChange('height', parseFloat(e.target.value))} />
                    </div>
                </div>
                <div className={styles.propGroup}>
                    <label>Wall Type</label>
                    <select value={wall.type} onChange={(e) => handleWallChange('type', e.target.value)}>
                        <option value="flat">Flat Wall</option>
                        <option value="staircase-asc">Staircase (Ascending)</option>
                        <option value="staircase-desc">Staircase (Descending)</option>
                    </select>
                </div>
                <div className={styles.propGroup}>
                    <label>Wall Color</label>
                    <input type="color" value={wall.backgroundColor} onChange={(e) => handleWallChange('backgroundColor', e.target.value)} style={{ width: '100%', height: 32 }} />
                </div>
            </div>
        </>
    );
};

const SingleImageControls = ({ frame, updateProject, currentProject }) => {
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
                <input
                    type="range" min="0.1" max="3" step="0.1"
                    value={frame.imageState?.scale || 1}
                    onChange={(e) => handleImageChange('scale', parseFloat(e.target.value))}
                />
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
                <button onClick={() => handleImageChange('rotation', ((frame.imageState?.rotation || 0) + 90) % 360)}>
                    Rotate Image 90°
                </button>
            </div>
            <div className={styles.propGroup}>
                <button className={styles.secondaryBtn} onClick={() => {
                    const updated = currentProject.frames.map(f => f.id === frame.id ? { ...f, imageId: null } : f);
                    updateProject(currentProject.id, { frames: updated });
                }}>Remove Image</button>
            </div>
        </>
    );
};

export default PropertiesPanel;
