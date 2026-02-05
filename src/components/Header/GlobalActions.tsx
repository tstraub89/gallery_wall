import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../../hooks/useProject';
import { useExport } from '../../hooks/useExport';
import { usePDFExport } from '../../hooks/usePDFExport';
import styles from './GlobalActions.module.css';
import ConfirmDialog from '../Common/ConfirmDialog';
import DropdownMenu from '../Common/DropdownMenu';
import ProBadge from '../Common/ProBadge';
import { importProjectBundle } from '../../utils/exportUtils';
import { saveImage } from '../../utils/imageStore';
import { v4 as uuidv4 } from 'uuid';
import { FolderOpen, Download } from 'lucide-react';

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
    const {
        isExporting: isBusy,
        exportError: err,
        setExportError: setErr,
        exportToPng,
        exportToGwall,
        exportPhotosCrops
    } = useExport();

    const {
        isExporting: isPDFBusy,
        exportError: pdfErr,
        setExportError: setPdfErr,
        exportToPDFGuide
    } = usePDFExport();

    // Combined states
    const isExporting = isBusy || isPDFBusy;
    const exportError = err || pdfErr;
    const setExportError = (msg: string | null) => {
        setErr(msg);
        setPdfErr(msg);
    };

    const [showClearConfirm, setShowClearConfirm] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClearCanvas = () => setShowClearConfirm(true);

    const confirmClearCanvas = () => {
        if (!currentProject) return;
        updateProject(currentProject.id, { frames: [] });
        setShowClearConfirm(false);
    };

    // Import logic currently remains here as it deals with File Inputs and Project Context directly
    // Ideally could be moved to a useImport hook or similar, but this is fine for now.
    const handleProjectImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // We can use isExporting state for loading UI or create a local one?
        // Let's rely on the fact that isExporting is technically "isBusy" in the UI
        // But for clarity let's just do it
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

        } catch (err: any) {
            alert('Failed to import: ' + err.message);
        } finally {
            e.target.value = '';
        }
    };

    const triggerImport = () => fileInputRef.current?.click();

    if (!currentProject) return null;

    return (
        <div className={styles.container}>
            {/* Project Menu */}
            <DropdownMenu
                label="Project"
                icon={<FolderOpen size={16} />}
                items={[
                    { 
                        label: (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                                <span>Import Project (.gwall)</span>
                                <ProBadge />
                            </div>
                        ), 
                        onClick: triggerImport, 
                        title: 'Load a saved project including all photos' 
                    },
                    { 
                        label: (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                                <span>Export Project (.gwall)</span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '2px 4px', borderRadius: '4px', lineHeight: 1 }}>PRO</span>
                            </div>
                        ), 
                        onClick: exportToGwall, 
                        title: 'Save project with all photos for backup or sharing' 
                    },
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
                    { label: 'Snapshot (JPEG)', onClick: () => exportToPng(), title: 'Save a high-res snapshot of your wall layout' },
                    { 
                        label: (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                                <span>Hanging Guide (PDF)</span>
                                <ProBadge />
                            </div>
                        ), 
                        onClick: exportToPDFGuide, 
                        title: 'Download a printable guide with measurements and hang heights' 
                    },
                    { 
                        label: (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                                <span>Export Project (.gwall)</span>
                                <ProBadge />
                            </div>
                        ), 
                        onClick: exportToGwall, 
                        title: 'Save project with all photos for backup or sharing' 
                    },
                    { 
                        label: (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                                <span>Cropped Photos (.zip)</span>
                                <ProBadge />
                            </div>
                        ), 
                        onClick: exportPhotosCrops, 
                        title: 'High-res cropped photos ready for printing' 
                    }
                ]}
            />

            {isExporting && (
                <FullScreenOverlay>
                    <div className={styles.spinner}></div>
                    <p>{isPDFBusy ? 'Preparing Hanging Guide...' : 'Preparing...'}</p>
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
