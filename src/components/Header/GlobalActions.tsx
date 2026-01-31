import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../hooks/useProject';
import styles from './GlobalActions.module.css';
import { toBlob } from 'html-to-image';
import { PPI } from '../../constants';
import ConfirmDialog from '../Common/ConfirmDialog';
import DropdownMenu from '../Common/DropdownMenu';
import { generateProjectZip, exportProjectBundle, importProjectBundle } from '../../utils/exportUtils';
import { saveImage } from '../../utils/imageStore';
import { v4 as uuidv4 } from 'uuid';
import { FolderOpen, Download } from 'lucide-react';

// Helper to convert blob URL or external URL to base64
const blobToBase64 = (url: string): Promise<string | ArrayBuffer | null> => new Promise((resolve, reject) => {
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

const waitForImages = (node: HTMLElement): Promise<void[]> => {
    const images = Array.from(node.querySelectorAll('img'));
    return Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>(resolve => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        });
    }));
};

const FullScreenOverlay = ({ children }: { children: React.ReactNode }) => {
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
    const [exportError, setExportError] = useState<string | null>(null);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const isBusy = isExportingPNG || isExportingPhotos;

    const handleExport = async () => {
        if (!currentProject) return;
        const node = document.getElementById('canvas-wall');
        if (!node) {
            alert('Could not find wall to export.');
            return;
        }

        setIsExportingPNG(true);
        setExportError(null);

        const imgElements = Array.from(node.querySelectorAll('img'));
        const originalSources = new Map();
        let failedConversions = 0;

        try {
            for (const img of imgElements) {
                if (img.src && (img.src.startsWith('blob:') || img.src.startsWith('http'))) {
                    originalSources.set(img, img.src);
                    try {
                        const b64 = await blobToBase64(img.src);
                        if (typeof b64 === 'string') {
                            img.src = b64;
                        }
                    } catch {
                        // Track failed conversion but continue with export
                        failedConversions++;
                    }
                }
            }

            await waitForImages(node);
            await new Promise(resolve => setTimeout(resolve, 300));

            const currentWidth = currentProject.wallConfig.width * PPI;
            const currentHeight = currentProject.wallConfig.height * PPI;
            const targetWidth = 1920;
            const targetHeight = 1080;
            const scaleToHD = Math.max(targetWidth / currentWidth, targetHeight / currentHeight, 1.0);
            const scales = [scaleToHD, 1.0, 0.8, 0.5];

            let blob = null;
            let lastError = null;

            for (const s of scales) {
                try {
                    const widthPx = currentWidth;
                    const heightPx = currentHeight;

                    blob = await toBlob(node, {
                        width: widthPx,
                        height: heightPx,
                        pixelRatio: s,
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

            if (failedConversions > 0) {
                setExportError(`Export completed but ${failedConversions} image(s) may be missing`);
            }
        } catch (err: any) {
            console.error('Export failed', err);
            setExportError(err instanceof Event ? 'Browser Error (Images fail to load)' : (err.message || String(err)));
        } finally {
            for (const [img, src] of originalSources.entries()) img.src = src;
            setIsExportingPNG(false);
        }
    };

    const handleProjectExport = async () => {
        if (!currentProject) return;
        setIsExportingPhotos(true);
        try {
            const result = await exportProjectBundle(currentProject);
            if (result.errorCount > 0) {
                alert(`Export completed with ${result.errorCount} warning(s). Check console for details.`);
            }
        } catch (err: any) {
            alert(`Project export failed: ${err.message}`);
        } finally {
            setIsExportingPhotos(false);
        }
    };

    const handleProjectImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExportingPhotos(true);
        try {
            const { project, images } = await importProjectBundle(file);

            const idMap = new Map<string, string>();
            const remappedImages: { id: string; blob: Blob }[] = [];

            for (const img of images) {
                const newId = uuidv4();
                idMap.set(img.id, newId);
                remappedImages.push({ id: newId, blob: img.blob });
            }

            const updatedFrames = project.frames.map((f: any) => ({
                ...f,
                imageId: f.imageId ? (idMap.get(f.imageId) || null) : null
            }));

            const updatedImagesArray = project.images ? project.images
                .filter((id: any) => idMap.has(id))
                .map((id: any) => idMap.get(id)) : [];

            for (const img of remappedImages) {
                await saveImage(img.id, img.blob);
            }

            const newId = addProject(project.name + ' (Imported)');
            updateProject(newId, {
                frames: updatedFrames,
                wallConfig: project.wallConfig,
                library: project.library || [],
                images: updatedImagesArray
            });

            // No alert needed, change is visible
        } catch (err: any) {
            alert('Failed to import: ' + err.message);
        } finally {
            setIsExportingPhotos(false);
            e.target.value = '';
        }
    };

    const handleShoppingListExport = () => {
        if (!currentProject) return;
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
        if (!currentProject) return;
        setIsExportingPhotos(true);
        try {
            const result = await generateProjectZip(currentProject);
            if (result.errorCount > 0) {
                alert(`Export completed with ${result.errorCount} warning(s). Check console for details.`);
            }
        } catch (err: any) {
            alert(`Photo export failed: ${err.message}`);
        } finally {
            setIsExportingPhotos(false);
        }
    };

    const handleClearCanvas = () => {
        setShowClearConfirm(true);
    };

    const confirmClearCanvas = () => {
        if (!currentProject) return;
        updateProject(currentProject.id, { frames: [] });
        setShowClearConfirm(false);
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const triggerImport = () => fileInputRef.current?.click();

    if (!currentProject) return null;

    return (
        <div className={styles.container}>
            {/* Project Menu */}
            <DropdownMenu
                label="Project"
                icon={<FolderOpen size={16} />}
                items={[
                    { label: 'Import Project (.gwall)', onClick: triggerImport, title: 'Load a saved project including all photos' },
                    { label: 'Export Project (.gwall)', onClick: handleProjectExport, title: 'Save project with all photos for backup or sharing' },
                    { separator: true },
                    { label: 'Reset / Clear Canvas', onClick: handleClearCanvas, danger: true, title: 'Remove all frames from canvas' }
                ]}
            />
            {/* Hidden Input for Import */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".gwall"
                onChange={handleProjectImport}
                style={{ display: 'none' }}
            />

            {/* Export Menu */}
            <DropdownMenu
                label="Export"
                icon={<Download size={16} />}
                items={[
                    { label: 'Save Image (PNG)', onClick: handleExport, title: 'Screenshot of your wall layout' },
                    { label: 'Shopping List (.txt)', onClick: handleShoppingListExport, title: 'Text list of all frames for shopping' },
                    { label: 'Export Photos (.zip)', onClick: handlePhotoExport, title: 'High-res cropped photos ready for printing' }
                ]}
            />

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
        </div>
    );
};

export default GlobalActions;
