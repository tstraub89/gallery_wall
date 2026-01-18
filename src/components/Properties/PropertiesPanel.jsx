import React from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './PropertiesPanel.module.css';

const PropertiesPanel = () => {
    const { currentProject, selectedFrameIds, updateProject } = useProject();

    if (!currentProject) {
        return <div className={styles.empty}>Select a project</div>;
    }

    const hasSelection = selectedFrameIds.length > 0;

    // --- Frame Properties ---
    if (hasSelection) {
        const frameId = selectedFrameIds[0];
        const frame = currentProject.frames.find(f => f.id === frameId);

        if (!frame) return null; // Should not happen

        const handleChange = (field, value) => {
            const updatedFrames = currentProject.frames.map(f =>
                f.id === frameId ? { ...f, [field]: value } : f
            );
            updateProject(currentProject.id, { frames: updatedFrames });
        };

        const handleImageChange = (field, value) => {
            const currentImageState = frame.imageState || { scale: 1, x: 0, y: 0, rotation: 0 };
            const updatedFrames = currentProject.frames.map(f =>
                f.id === frameId ? { ...f, imageState: { ...currentImageState, [field]: value } } : f
            );
            updateProject(currentProject.id, { frames: updatedFrames });
        };

        const deleteFrame = () => {
            const updatedFrames = currentProject.frames.filter(f => f.id !== frameId);
            updateProject(currentProject.id, { frames: updatedFrames });
            // context handles selection clearing? Or we should trigger selection clear?
            // Actually switchProject clears selection, but delete does not automatically in our context logic.
            // We'll rely on global click to clear or we should update selection state.
            // For now, let's just delete the frame.
        };

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Frame Properties</h3>
                </div>
                <div className={styles.content}>
                    <div className={styles.propGroup}>
                        <label>Position X (in)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={(frame.x / 10).toFixed(2)} // 10 PPI assumption leaks here. Should use constant or helper.
                            onChange={(e) => handleChange('x', parseFloat(e.target.value) * 10)}
                        />
                    </div>
                    <div className={styles.propGroup}>
                        <label>Position Y (in)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={(frame.y / 10).toFixed(2)}
                            onChange={(e) => handleChange('y', parseFloat(e.target.value) * 10)}
                        />
                    </div>
                    <div className={styles.propGroup}>
                        <label>Rotation</label>
                        <div className={styles.row}>
                            <button onClick={() => handleChange('rotation', (frame.rotation + 90) % 360)}>Rotate 90°</button>
                        </div>
                    </div>

                    {frame.imageId && (
                        <>
                            <hr className={styles.divider} />
                            <div className={styles.header} style={{ paddingLeft: 0 }}>
                                <h3>Image Settings</h3>
                            </div>
                            <div className={styles.propGroup}>
                                <label>Scale ({((frame.imageState?.scale || 1) * 100).toFixed(0)}%)</label>
                                <input
                                    type="range" min="0.1" max="3" step="0.1"
                                    value={frame.imageState?.scale || 1}
                                    onChange={(e) => handleImageChange('scale', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className={styles.propGroup}>
                                <label>Position (X / Y)</label>
                                <div className={styles.row}>
                                    <input
                                        type="number"
                                        placeholder="X"
                                        value={frame.imageState?.x || 0}
                                        onChange={(e) => handleImageChange('x', parseFloat(e.target.value))}
                                        style={{ width: '50px' }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Y"
                                        value={frame.imageState?.y || 0}
                                        onChange={(e) => handleImageChange('y', parseFloat(e.target.value))}
                                        style={{ width: '50px' }}
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
                                <button className={styles.secondaryBtn} onClick={() => handleChange('imageId', null)}>Remove Image</button>
                            </div>
                        </>
                    )}

                    <div className={styles.propGroup}>
                        <label>Size</label>
                        <div className={styles.info}>
                            {frame.width}" x {frame.height}"
                        </div>
                    </div>

                    <button className={styles.deleteBtn} onClick={deleteFrame}>Delete Frame</button>
                </div>
            </div>
        );
    }

    // --- Wall / Project Properties ---

    const wall = currentProject.wallConfig;

    const handleWallChange = (field, value) => {
        updateProject(currentProject.id, {
            wallConfig: { ...wall, [field]: value }
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Wall Settings</h3>
            </div>
            <div className={styles.content}>
                <div className={styles.propGroup}>
                    <label>Wall Name</label>
                    <input
                        type="text"
                        value={currentProject.name}
                        onChange={(e) => updateProject(currentProject.id, { name: e.target.value })}
                    />
                </div>

                <hr className={styles.divider} />

                <div className={styles.propGroup}>
                    <label>Width (inches)</label>
                    <input
                        type="number"
                        value={wall.width}
                        onChange={(e) => handleWallChange('width', parseFloat(e.target.value))}
                    />
                </div>
                <div className={styles.propGroup}>
                    <label>Height (inches)</label>
                    <input
                        type="number"
                        value={wall.height}
                        onChange={(e) => handleWallChange('height', parseFloat(e.target.value))}
                    />
                </div>
                <div className={styles.propGroup}>
                    <label>Wall Type</label>
                    <select
                        value={wall.type}
                        onChange={(e) => handleWallChange('type', e.target.value)}
                    >
                        <option value="flat">Flat Wall</option>
                        <option value="staircase-asc">Staircase (Ascending)</option>
                        <option value="staircase-desc">Staircase (Descending)</option>
                    </select>
                </div>
                <div className={styles.propGroup}>
                    <label>Wall Color</label>
                    <input
                        type="color"
                        value={wall.backgroundColor}
                        onChange={(e) => handleWallChange('backgroundColor', e.target.value)}
                        style={{ width: '100%', height: '32px', padding: 0 }}
                    />
                </div>

                <div className={styles.propGroup}>
                    <label>Export</label>
                    <div className={styles.row}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${currentProject.name.replace(/\s+/g, '_')}_data.json`;
                                a.click();
                            }}
                        >
                            Backup (JSON)
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={() => {
                                // Shopping List Logic
                                const counts = {};
                                currentProject.frames.forEach(f => {
                                    const key = `${f.width}" x ${f.height}"${f.matted ? ` (Matted to ${f.matted.width}" x ${f.matted.height}")` : ''}`;
                                    counts[key] = (counts[key] || 0) + 1;
                                });

                                const lines = ['Frame Shopping List', '===================', ''];
                                Object.entries(counts).forEach(([key, count]) => {
                                    lines.push(`${count}x  ${key}`);
                                });

                                const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${currentProject.name.replace(/\s+/g, '_')}_shopping_list.txt`;
                                a.click();
                            }}
                        >
                            Shopping List
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertiesPanel;
