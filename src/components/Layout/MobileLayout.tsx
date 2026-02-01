import React, { ReactNode, useState, useRef } from 'react';
import styles from './MobileLayout.module.css';
import { Undo2, Redo2, MoreVertical, Share2, ChevronDown, CircleHelp } from 'lucide-react';
import Logo from '../Header/Logo';
import { useProject } from '../../hooks/useProject';
import { useExport } from '../../hooks/useExport';
import ProjectSwitcher from '../Mobile/ProjectSwitcher';
import ConfirmDialog from '../Common/ConfirmDialog';
import HelpModal from '../Common/HelpModal';
import MobileLibrarySheet from '../Mobile/MobileLibrarySheet';
import MobileEditSheet from '../Mobile/MobileEditSheet';
import { importProjectBundle } from '../../utils/exportUtils';
import { saveImage } from '../../utils/imageStore';
import { v4 as uuidv4 } from 'uuid';
import { ViewportProvider } from '../../context/ViewportContext';

interface MobileLayoutProps {
    children: ReactNode;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, onUndo, onRedo, canUndo, canRedo }) => {
    const { currentProject, updateProject, addProject } = useProject();
    const { shareProjectImage, exportToGwall, exportShoppingList, isExporting } = useExport();

    const [showSwitcher, setShowSwitcher] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    // Dialog States
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Menu Actions --- //

    const handleClearCanvasClick = () => {
        setShowMenu(false);
        setShowClearConfirm(true);
    };

    const confirmClearCanvas = () => {
        if (currentProject) {
            updateProject(currentProject.id, { frames: [] });
        }
        setShowClearConfirm(false);
    };

    const handleSaveProject = async () => {
        setShowMenu(false);
        await exportToGwall();
    };

    const handleShoppingList = () => {
        setShowMenu(false);
        exportShoppingList();
    };

    const handleRenameClick = () => {
        if (currentProject) {
            setRenameValue(currentProject.name);
            setShowMenu(false);
            setShowRenameDialog(true);
        }
    };

    const confirmRename = () => {
        if (currentProject && renameValue.trim()) {
            updateProject(currentProject.id, { name: renameValue.trim() });
        }
        setShowRenameDialog(false);
    };

    const handleImportClick = () => {
        setShowMenu(false); // Close menu
        fileInputRef.current?.click(); // Trigger file input
    };

    const handleProjectImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

    return (
        <ViewportProvider>
            <div className={styles.mobileContainer}>
                {/* Hidden Import Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gwall"
                    onChange={handleProjectImport}
                    style={{ display: 'none' }}
                />

                {/* Simple Mobile Header */}
                <header className={styles.mobileHeader}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <div style={{ transform: 'scale(0.8)', transformOrigin: 'left center', width: '32px', overflow: 'hidden' }}>
                            <Logo />
                        </div>

                        <div
                            className={styles.projectTitle}
                            onClick={() => setShowSwitcher(true)}
                        >
                            <span className={styles.titleText}>{currentProject?.name || 'Untitled'}</span>
                            <ChevronDown size={14} className={styles.titleArrow} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <div className={styles.undoGroup}>
                            <button onClick={onUndo} disabled={!canUndo} className={styles.iconBtn}>
                                <Undo2 size={20} style={{ opacity: canUndo ? 1 : 0.3 }} />
                            </button>
                            <button onClick={onRedo} disabled={!canRedo} className={styles.iconBtn}>
                                <Redo2 size={20} style={{ opacity: canRedo ? 1 : 0.3 }} />
                            </button>
                        </div>

                        <button
                            className={styles.iconBtn}
                            onClick={() => shareProjectImage()}
                            disabled={isExporting}
                        >
                            <Share2 size={22} color="#007AFF" />
                        </button>

                        <button
                            className={styles.iconBtn}
                            onClick={() => setShowHelp(true)}
                        >
                            <CircleHelp size={22} />
                        </button>

                        <button
                            className={styles.iconBtn}
                            onClick={() => setShowMenu(true)}
                        >
                            <MoreVertical size={22} />
                        </button>
                    </div>
                </header>

                <main className={styles.mobileMain}>
                    {children}
                </main>

                <nav className={styles.bottomNav}>
                    <button className={`${styles.navItem} ${!showLibrary && !showEdit ? styles.active : ''}`} onClick={() => { setShowLibrary(false); setShowEdit(false); }}>
                        <div className={styles.navIcon} />
                        <span>View</span>
                    </button>
                    <button className={`${styles.navItem} ${showLibrary ? styles.active : ''}`} onClick={() => { setShowLibrary(true); setShowEdit(false); }}>
                        <div className={styles.navIcon} />
                        <span>Library</span>
                    </button>
                    <button className={`${styles.navItem} ${showEdit ? styles.active : ''}`} onClick={() => { setShowEdit(true); setShowLibrary(false); }}>
                        <div className={styles.navIcon} />
                        <span>Edit</span>
                    </button>
                </nav>

                <MobileLibrarySheet isOpen={showLibrary} onClose={() => setShowLibrary(false)} />
                <MobileEditSheet isOpen={showEdit} onClose={() => setShowEdit(false)} />

                {/* Overlays */}
                {showSwitcher && <ProjectSwitcher onClose={() => setShowSwitcher(false)} />}

                {/* Simple Menu Overlay */}
                {showMenu && (
                    <div className={styles.menuOverlay} onClick={() => setShowMenu(false)}>
                        <div className={styles.menuSheet} onClick={e => e.stopPropagation()}>
                            <div className={styles.menuItem} onClick={handleRenameClick}>Rename Project</div>
                            <div className={styles.menuItem} onClick={handleImportClick}>Import Project (.gwall)</div>
                            <div className={styles.menuItem} onClick={handleSaveProject}>Save Project File (.gwall)</div>
                            <div className={styles.menuItem} onClick={handleShoppingList}>Export Shopping List</div>
                            <div className={`${styles.menuItem} ${styles.danger}`} onClick={handleClearCanvasClick}>Clear Canvas</div>
                            <div className={styles.menuCancel} onClick={() => setShowMenu(false)}>Cancel</div>
                        </div>
                    </div>
                )}

                {/* Rename Dialog (Custom Modal) */}
                {showRenameDialog && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalBox}>
                            <h3>Rename Project</h3>
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className={styles.modalInput}
                                autoFocus
                            />
                            <div className={styles.modalActions}>
                                <button onClick={() => setShowRenameDialog(false)}>Cancel</button>
                                <button onClick={confirmRename} className={styles.primaryBtn}>Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {showClearConfirm && (
                    <ConfirmDialog
                        title="Clear Canvas"
                        message="Are you sure you want to remove ALL frames? This cannot be undone."
                        confirmLabel="Clear"
                        isDanger={true}
                        onConfirm={confirmClearCanvas}
                        onCancel={() => setShowClearConfirm(false)}
                    />
                )}

                {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

                {isExporting && (
                    <div className={styles.loadingOverlay}>
                        Preparing...
                    </div>
                )}
            </div>
        </ViewportProvider>
    );
};
