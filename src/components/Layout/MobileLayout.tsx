import React, { ReactNode, useState, useRef } from 'react';
import styles from './MobileLayout.module.css';
import { Undo2, Redo2, Share2, ChevronDown, CircleHelp, Grid, SlidersHorizontal, Menu, Save, FileText, FolderOpen, Eraser } from 'lucide-react';
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
    const { currentProject, updateProject, addProject, projects, switchProject, currentProjectId } = useProject();
    const { shareProjectImage, exportToGwall, exportShoppingList, isExporting } = useExport();

    const [showSwitcher, setShowSwitcher] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    // Dialog States
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
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

    // --- Edge Swipe Logic for Project Switching ---
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);
    const touchStartEdge = useRef<'left' | 'right' | null>(null);
    const [swipeEdge, setSwipeEdge] = useState<'left' | 'right' | null>(null);

    const handleTouchStartCapture = (e: React.TouchEvent) => {
        const t = e.touches[0];
        // 25px threshold for edge detection
        if (t.clientX < 25) {
            touchStartEdge.current = 'left';
            touchStartX.current = t.clientX;
            touchStartY.current = t.clientY;
            e.stopPropagation(); // Stop Canvas Pan
            setSwipeEdge('left');
        } else if (t.clientX > window.innerWidth - 25) {
            touchStartEdge.current = 'right';
            touchStartX.current = t.clientX;
            touchStartY.current = t.clientY;
            e.stopPropagation(); // Stop Canvas Pan
            setSwipeEdge('right');
        } else {
            touchStartEdge.current = null;
            setSwipeEdge(null);
        }
    };

    const handleTouchMoveCapture = (e: React.TouchEvent) => {
        if (touchStartEdge.current) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    const handleTouchEndCapture = (e: React.TouchEvent) => {
        if (!touchStartEdge.current) return;

        e.stopPropagation();

        const t = e.changedTouches[0];
        const deltaX = t.clientX - (touchStartX.current || 0);
        const deltaY = t.clientY - (touchStartY.current || 0);

        if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 50) {
            const allIds = Object.keys(projects);
            const currentIndex = allIds.indexOf(currentProjectId || '');

            if (currentIndex !== -1) {
                if (touchStartEdge.current === 'left' && deltaX > 0) {
                    const newIndex = (currentIndex - 1 + allIds.length) % allIds.length;
                    switchProject(allIds[newIndex]);
                } else if (touchStartEdge.current === 'right' && deltaX < 0) {
                    const newIndex = (currentIndex + 1) % allIds.length;
                    switchProject(allIds[newIndex]);
                }
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
        touchStartEdge.current = null;
        setSwipeEdge(null);
    };

    return (
        <ViewportProvider>
            <div
                className={styles.mobileContainer}
                onTouchStartCapture={handleTouchStartCapture}
                onTouchMoveCapture={handleTouchMoveCapture}
                onTouchEndCapture={handleTouchEndCapture}
            >
                {/* Edge Glow Visuals */}
                <div className={`${styles.edgeOverlay} ${styles.edgeLeft} ${swipeEdge === 'left' ? styles.active : ''}`} />
                <div className={`${styles.edgeOverlay} ${styles.edgeRight} ${swipeEdge === 'right' ? styles.active : ''}`} />

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
                    {/* Left Group: Logo + Project Title */}
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, gap: '4px' }}>
                        <div style={{ flexShrink: 0 }}>
                            <Logo />
                        </div>

                        {/* Project Title / Switcher */}
                        <div
                            className={styles.projectTitle}
                            onClick={() => setShowSwitcher(true)}
                        >
                            <span className={styles.titleText}>{currentProject?.name || 'Untitled'}</span>
                            <ChevronDown size={14} className={styles.titleArrow} />
                        </div>
                    </div>

                    {/* Undo/Redo Only */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <div className={styles.undoGroup}>
                            <button onClick={onUndo} disabled={!canUndo} className={styles.iconBtn}>
                                <Undo2 size={20} style={{ opacity: canUndo ? 1 : 0.3 }} />
                            </button>
                            <button onClick={onRedo} disabled={!canRedo} className={styles.iconBtn}>
                                <Redo2 size={20} style={{ opacity: canRedo ? 1 : 0.3 }} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className={styles.mobileMain}>
                    {children}
                </main>

                <nav className={styles.bottomNav}>
                    <button className={`${styles.navItem} ${showLibrary ? styles.active : ''}`} onClick={() => { setShowLibrary(true); setShowEdit(false); setShowMenu(false); }}>
                        <Grid size={24} />
                        <span>Library</span>
                    </button>
                    <button className={`${styles.navItem} ${showEdit ? styles.active : ''}`} onClick={() => { setShowEdit(true); setShowLibrary(false); setShowMenu(false); }}>
                        <SlidersHorizontal size={24} />
                        <span>Edit</span>
                    </button>
                    <button className={`${styles.navItem} ${showMenu ? styles.active : ''}`} onClick={() => { setShowMenu(true); setShowLibrary(false); setShowEdit(false); }}>
                        <Menu size={24} />
                        <span>Menu</span>
                    </button>
                </nav>

                <MobileLibrarySheet isOpen={showLibrary} onClose={() => setShowLibrary(false)} />
                <MobileEditSheet isOpen={showEdit} onClose={() => setShowEdit(false)} />

                {/* Overlays */}
                {showSwitcher && <ProjectSwitcher onClose={() => setShowSwitcher(false)} />}

                {/* Expanded Menu Overlay */}
                {showMenu && (
                    <div className={styles.menuOverlay} onClick={() => setShowMenu(false)}>
                        <div className={styles.menuSheet} onClick={e => e.stopPropagation()}>


                            <div className={styles.menuSectionLabel}>Export</div>
                            <div className={styles.menuItem} onClick={() => { setShowMenu(false); shareProjectImage(); }}>
                                <Share2 size={16} style={{ marginRight: 8 }} />
                                Share Image (JPEG)
                            </div>
                            <div className={styles.menuItem} onClick={handleSaveProject}>
                                <Save size={16} style={{ marginRight: 8 }} />
                                Save Project File (.gwall)
                            </div>
                            <div className={styles.menuItem} onClick={handleShoppingList}>
                                <FileText size={16} style={{ marginRight: 8 }} />
                                Export Shopping List
                            </div>

                            <div className={styles.menuSectionLabel}>System</div>
                            <div className={styles.menuItem} onClick={handleImportClick}>
                                <FolderOpen size={16} style={{ marginRight: 8 }} />
                                Import Project (.gwall)
                            </div>
                            <div className={styles.menuItem} onClick={() => { setShowMenu(false); setShowHelp(true); }}>
                                <CircleHelp size={16} style={{ marginRight: 8 }} />
                                Help & Guide
                            </div>
                            <div className={`${styles.menuItem} ${styles.danger}`} onClick={handleClearCanvasClick}>
                                <Eraser size={16} style={{ marginRight: 8 }} />
                                Clear Canvas
                            </div>

                            <div className={styles.menuCancel} onClick={() => setShowMenu(false)}>Cancel</div>
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
