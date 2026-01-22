import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../context/ProjectContext';
import styles from './GlobalActions.module.css';
import { toBlob } from 'html-to-image';
import { PPI } from '../../constants';
import ConfirmDialog from '../Common/ConfirmDialog';
import HelpModal from '../Common/HelpModal';
import { generateProjectZip, exportProjectBundle, importProjectBundle } from '../../utils/exportUtils';
import { saveImage } from '../../utils/imageStore';
import { v4 as uuidv4 } from 'uuid';
import { Github } from 'lucide-react';

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

const FullScreenOverlay = ({ children }) => {
    return createPortal(
        <div className={styles.exportOverlay}>
            {children}
        </div>,
        document.body
    );
};


const GlobalActions = () => {
    const { currentProject, updateProject, addProject } = useProject();
    const [isExportingPNG, setIsExportingPNG] = useState(false);
    const [isExportingPhotos, setIsExportingPhotos] = useState(false);
    const [exportError, setExportError] = useState(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const isBusy = isExportingPNG || isExportingPhotos;

    const handleExport = async () => {
        const node = document.getElementById('canvas-wall');
        if (!node) {
            alert('Could not find wall to export.');
            return;
        }

        setIsExportingPNG(true);
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
                    } catch {
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
            setIsExportingPNG(false);
        }
    };

    const handleProjectExport = async () => {
        setIsExportingPhotos(true); // Using same spinner for bundle export
        try {
            const result = await exportProjectBundle(currentProject);
            if (result.errorCount > 0) {
                alert(`Export completed with ${result.errorCount} warning(s). Check console for details.`);
            }
        } catch (err) {
            alert(`Project export failed: ${err.message}`);
        } finally {
            setIsExportingPhotos(false);
        }
    };

    const handleProjectImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsExportingPhotos(true);
        try {
            const { project, images } = await importProjectBundle(file);

            // 1. Remap IDs to ensure no clashes with existing local projects
            const idMap = new Map();
            const remappedImages = [];

            for (const img of images) {
                const newId = uuidv4();
                idMap.set(img.id, newId);
                remappedImages.push({ id: newId, blob: img.blob });
            }

            // Update frame references
            const updatedFrames = project.frames.map(f => ({
                ...f,
                imageId: f.imageId ? (idMap.get(f.imageId) || null) : null
            }));

            // Prune library to only include successfully remapped/found images
            const updatedImagesArray = project.images ? project.images
                .filter(id => idMap.has(id))
                .map(id => idMap.get(id)) : [];

            // 2. Save images to IndexedDB
            for (const img of remappedImages) {
                await saveImage(img.id, img.blob);
            }

            // 3. Add Project
            const newId = addProject(project.name + ' (Imported)');
            updateProject(newId, {
                frames: updatedFrames,
                wallConfig: project.wallConfig,
                library: project.library || [],
                images: updatedImagesArray
            });

            alert('Project imported successfully!');
        } catch (err) {
            alert('Failed to import: ' + err.message);
        } finally {
            setIsExportingPhotos(false);
            e.target.value = null;
        }
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

    const handlePhotoExport = async () => {
        setIsExportingPhotos(true);
        try {
            const result = await generateProjectZip(currentProject);
            if (result.errorCount > 0) {
                alert(`Export completed with ${result.errorCount} warning(s). Check console for details.`);
            }
        } catch (err) {
            alert(`Photo export failed: ${err.message}`);
        } finally {
            setIsExportingPhotos(false);
        }
    };

    const handleClearCanvas = () => {
        setShowClearConfirm(true);
    };

    const confirmClearCanvas = () => {
        updateProject(currentProject.id, { frames: [] });
        setShowClearConfirm(false);
    };

    if (!currentProject) return null;

    return (
        <div className={styles.container}>
            {/* Project Management */}
            <label className={styles.secondaryBtn} title="Import a previously saved project .gwall file">
                Import Project
                <input type="file" accept=".gwall" onChange={handleProjectImport} style={{ display: 'none' }} />
            </label>
            <button className={styles.secondaryBtn} onClick={handleProjectExport} title="Save project bundle (.gwall) including photos">
                Export Project
            </button>

            <div className={styles.divider} />

            {/* RESET */}
            <button className={`${styles.secondaryBtn} ${styles.removeAction}`} onClick={handleClearCanvas} title="Remove all frames from the canvas">
                Reset Project
            </button>

            <div className={styles.divider} />

            {/* Outputs */}
            <button className={styles.btn} onClick={handleExport} disabled={isBusy} title="Download a PNG image of your gallery wall">
                {isExportingPNG ? 'Saving PNG...' : 'Save PNG'}
            </button>
            <button className={styles.secondaryBtn} onClick={handleShoppingListExport} title="Download a text list of frames and sizes">
                Shopping List
            </button>
            <button className={styles.secondaryBtn} onClick={handlePhotoExport} disabled={isBusy} title="Export high-res cropped photos for printing">
                {isExportingPhotos ? 'Exporting...' : 'Export Photos'}
            </button>

            {isBusy && (
                <FullScreenOverlay>
                    <div className={styles.spinner}></div>
                    <p>Processing...</p>
                </FullScreenOverlay>
            )}
            {exportError && (
                <div className={styles.errorBanner} onClick={() => setExportError(null)}>
                    Error: {exportError} (Click to dismiss)
                </div>
            )}

            {showClearConfirm && (
                <ConfirmDialog
                    title="Reset Project"
                    message="Are you sure you want to remove ALL frames from the canvas? This cannot be undone (without Ctrl+Z)."
                    confirmLabel="Reset Canvas"
                    onConfirm={confirmClearCanvas}
                    onCancel={() => setShowClearConfirm(false)}
                    isDanger={true}
                />
            )}

            <a
                href="https://github.com/tstraub89/gallery_wall"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.helpBtn}
                title="View Source on GitHub"
            >
                <Github size={14} strokeWidth={2.5} />
            </a>

            <button className={styles.helpBtn} onClick={() => setShowHelp(true)} title="Show Help Guide">?</button>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div>
    );
};

export default GlobalActions;
