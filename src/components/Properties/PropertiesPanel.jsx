import React from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './PropertiesPanel.module.css';
import { toBlob } from 'html-to-image';
import { PPI } from '../../constants';

// Helper to convert blob URL or external URL to base64
const blobToBase64 = (url) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
});

const waitForImages = (node) => {
    const images = Array.from(node.querySelectorAll('img'));
    return Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even on error
        });
    }));
};

const PropertiesPanel = () => {
    const { currentProject, selectedFrameIds, updateProject, addProject } = useProject();

    const [isExporting, setIsExporting] = React.useState(false);
    const [exportError, setExportError] = React.useState(null);

    const handleExport = async () => {
        const node = document.getElementById('canvas-wall');
        if (!node) {
            alert('Could not find wall to export.');
            return;
        }

        setIsExporting(true);
        setExportError(null);

        // Track original sources to restore later
        const imgElements = Array.from(node.querySelectorAll('img'));
        const originalSources = new Map();

        try {
            // CRITICAL FOR FIREFOX: Convert all blob URLs to base64 before export
            console.log("Preparing images for export...");
            for (const img of imgElements) {
                if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('http'))) {
                    originalSources.set(img, img.src);
                    try {
                        const b64 = await blobToBase64(img.src);
                        img.src = b64;
                    } catch (e) {
                        console.warn("Failed to convert image to base64", img.src, e);
                    }
                }
            }

            // Wait for images to acknowledge the new base64 src
            await waitForImages(node);
            await new Promise(resolve => setTimeout(resolve, 300)); // Additional small delay

            const scales = [1.0, 0.8, 0.6, 0.4, 0.2, 0.1];
            let blob = null;
            let lastError = null;

            for (const s of scales) {
                try {
                    console.log(`Attempting export at scale ${s}...`);
                    const widthPx = currentProject.wallConfig.width * PPI * s;
                    const heightPx = currentProject.wallConfig.height * PPI * s;

                    blob = await toBlob(node, {
                        width: widthPx,
                        height: heightPx,
                        pixelRatio: 1,
                        style: {
                            transform: 'none',
                            left: '0',
                            top: '0',
                            position: 'relative'
                        },
                        cacheBust: true,
                        // Firefox specific performance options
                        skipFonts: true,
                    });
                    if (blob) break;
                } catch (err) {
                    console.warn(`Scale ${s} failed:`, err);
                    lastError = err;
                }
            }

            if (!blob) {
                throw lastError || new Error('Failed to generate image blob at any resolution.');
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${currentProject.name || 'gallery_wall'}.png`;
            link.href = url;
            link.click();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Export failed permanently', err);
            let msg = 'Unknown error';
            if (err instanceof Event) {
                msg = `Browser Event: ${err.type} (This often means an image failed to load or a CORS security error occurred)`;
            } else if (err && err.message) {
                msg = err.message;
            } else {
                try {
                    msg = JSON.stringify(err);
                } catch (e) {
                    msg = String(err);
                }
            }
            setExportError(msg);
        } finally {
            // RESTORE original sources
            for (const [img, src] of originalSources.entries()) {
                img.src = src;
            }
            setIsExporting(false);
        }
    };

    const handleJSONExport = () => {
        const data = JSON.stringify(currentProject, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${currentProject.name || 'project'}_backup.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleJSONImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const project = JSON.parse(event.target.result);
                // Simple validation
                if (!project.frames || !project.wallConfig) throw new Error('Invalid project file');

                // Add as new project
                const newId = addProject(project.name + ' (Imported)');
                updateProject(newId, {
                    frames: project.frames,
                    wallConfig: project.wallConfig,
                    library: project.library || [],
                    images: project.images || []
                });
                alert('Project imported successfully!');
            } catch (err) {
                alert('Failed to import project: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    if (!currentProject) {
        return <div className={styles.empty}>Select a project</div>;
    }

    const hasSelection = selectedFrameIds.length > 0;

    const actionProps = {
        handleExport,
        isExporting,
        handleJSONExport,
        handleJSONImport,
        exportError
    };

    return (
        <div className={styles.container}>
            {hasSelection ? (
                <FrameProps
                    currentProject={currentProject}
                    selectedFrameIds={selectedFrameIds}
                    updateProject={updateProject}
                    actionProps={actionProps}
                />
            ) : (
                <WallProps
                    currentProject={currentProject}
                    updateProject={updateProject}
                    actionProps={actionProps}
                />
            )}
        </div>
    );
};

// --- Frame Properties Component ---
const FrameProps = ({ currentProject, selectedFrameIds, updateProject, actionProps }) => {
    const selectedFrames = currentProject.frames.filter(f => selectedFrameIds.includes(f.id));

    const getValue = (key) => {
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
                <h3>Properties ({selectedFrameIds.length})</h3>
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

                {selectedFrameIds.length === 1 && (
                    <>
                        <hr className={styles.divider} />
                        {currentProject.frames.find(f => f.id === selectedFrameIds[0])?.imageId && (
                            <SingleImageControls
                                frame={currentProject.frames.find(f => f.id === selectedFrameIds[0])}
                                updateProject={updateProject}
                                currentProject={currentProject}
                            />
                        )}
                    </>
                )}

                <button className={styles.deleteBtn} onClick={() => {
                    const updated = currentProject.frames.filter(f => !selectedFrameIds.includes(f.id));
                    updateProject(currentProject.id, { frames: updated });
                }}>Delete {selectedFrameIds.length > 1 ? 'Frames' : 'Frame'}</button>

                <ActionsSection {...actionProps} />
            </div>
        </>
    );
};

// --- Wall Properties Component ---
const WallProps = ({ currentProject, updateProject, actionProps }) => {
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

                <ActionsSection {...actionProps} />
            </div>
        </>
    );
};

const ActionsSection = ({ handleExport, isExporting, handleJSONExport, handleJSONImport, exportError }) => (
    <div className={styles.propGroup} style={{ marginTop: 20 }}>
        <label>Project Actions</label>
        <div className={styles.column}>
            <button className={styles.actionBtn} onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Saving Image...' : 'Save Image (PNG)'}
            </button>

            <div className={styles.row} style={{ marginTop: 8 }}>
                <button className={styles.secondaryBtn} onClick={handleJSONExport} style={{ flex: 1 }}>
                    Export JSON
                </button>
                <label className={styles.secondaryBtn} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
                    Import JSON
                    <input type="file" accept=".json" onChange={handleJSONImport} style={{ display: 'none' }} />
                </label>
            </div>
        </div>

        {isExporting && (
            <div className={styles.exportOverlay}>
                <div className={styles.spinner}></div>
                <p>Generating project image...</p>
                <p style={{ fontSize: '10px', opacity: 0.7 }}>Optimizing resources for Firefox...</p>
            </div>
        )}

        {exportError && (
            <div className={styles.errorBox} style={{ marginTop: 12, padding: 8, background: '#fee', border: '1px solid #faa', borderRadius: 4, fontSize: '11px' }}>
                <strong>Export Error:</strong> {exportError}
                <p style={{ marginTop: 4 }}>Firefox can be restrictive. Try a smaller wall or a different browser if it persistent.</p>
            </div>
        )}
    </div>
);

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
