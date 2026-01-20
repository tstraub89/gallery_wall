import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import styles from './GlobalActions.module.css';
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
            img.onerror = resolve;
        });
    }));
};

const GlobalActions = () => {
    const { currentProject, updateProject, addProject } = useProject();
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState(null);

    const handleExport = async () => {
        const node = document.getElementById('canvas-wall');
        if (!node) {
            alert('Could not find wall to export.');
            return;
        }

        setIsExporting(true);
        setExportError(null);

        const imgElements = Array.from(node.querySelectorAll('img'));
        const originalSources = new Map();

        try {
            for (const img of imgElements) {
                if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('http'))) {
                    originalSources.set(img, img.src);
                    try {
                        const b64 = await blobToBase64(img.src);
                        img.src = b64;
                    } catch (e) {
                        // Silently handle base64 conversion errors during export
                    }
                }
            }

            await waitForImages(node);
            await new Promise(resolve => setTimeout(resolve, 300));

            const scales = [1.0, 0.8, 0.6, 0.4, 0.2, 0.1];
            let blob = null;
            let lastError = null;

            for (const s of scales) {
                try {
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
                        skipFonts: true,
                    });
                    if (blob) break;
                } catch (err) {
                    lastError = err;
                }
            }

            if (!blob) throw lastError || new Error('Failed to generate image blob');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${currentProject.name || 'gallery'}.png`;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Export failed', err);
            setExportError(err instanceof Event ? 'Browser Error (Images fail to load)' : (err.message || String(err)));
        } finally {
            for (const [img, src] of originalSources.entries()) img.src = src;
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
                if (!project.frames || !project.wallConfig) throw new Error('Invalid project file');
                const newId = addProject(project.name + ' (Imported)');
                updateProject(newId, {
                    frames: project.frames,
                    wallConfig: project.wallConfig,
                    library: project.library || [],
                    images: project.images || []
                });
                alert('Project imported successfully!');
            } catch (err) {
                alert('Failed to import: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    const handleShoppingListExport = () => {
        if (!currentProject.frames.length) {
            alert("No frames on the canvas yet.");
            return;
        }

        const list = currentProject.frames.map((f, i) => {
            const hasImage = !!f.imageId;
            let line = `Frame ${i + 1}: ${f.width}" x ${f.height}"`;
            if (f.matted) {
                line += ` (Matted to ${f.matted.width}" x ${f.matted.height}")`;
            }
            line += ` - Status: ${hasImage ? 'Filled' : 'Empty'}`;
            return line;
        }).join('\n');

        const header = `GALLERY WALL SHOPPING LIST\nProject: ${currentProject.name}\nTotal Frames: ${currentProject.frames.length}\n----------------------------\n\n`;
        const blob = new Blob([header + list], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${currentProject.name || 'project'}_shopping_list.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleClearCanvas = () => {
        if (confirm("Are you sure you want to remove ALL frames from the canvas? This cannot be undone (without Ctrl+Z).")) {
            updateProject(currentProject.id, { frames: [] });
        }
    };

    if (!currentProject) return null;

    return (
        <div className={styles.container}>
            <button className={styles.btn} onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Saving PNG...' : 'Save PNG'}
            </button>
            <div className={styles.divider} />
            <button className={styles.secondaryBtn} onClick={handleJSONExport}>Export Project</button>
            <label className={styles.secondaryBtn}>
                Import Project
                <input type="file" accept=".json" onChange={handleJSONImport} style={{ display: 'none' }} />
            </label>
            <button className={styles.secondaryBtn} onClick={handleShoppingListExport}>Shopping List</button>
            <button className={`${styles.secondaryBtn} ${styles.removeAction}`} onClick={handleClearCanvas}>Reset Project</button>

            {isExporting && (
                <div className={styles.exportOverlay}>
                    <div className={styles.spinner}></div>
                    <p>Generating project image...</p>
                </div>
            )}
            {exportError && (
                <div className={styles.errorBanner} onClick={() => setExportError(null)}>
                    Error: {exportError} (Click to dismiss)
                </div>
            )}
        </div>
    );
};

export default GlobalActions;
