import React, { ReactNode, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import styles from './MobileLayout.module.css';
import { Undo2, Redo2, Share2, ChevronDown, CircleHelp, Grid, SlidersHorizontal, Menu, Save, FolderOpen, Eraser, Printer, Sparkles, Bug, Wand2 } from 'lucide-react';
import Logo from '../Header/Logo';
import pkg from '../../../package.json';
import { useProject } from '../../hooks/useProject';
import { useExport } from '../../hooks/useExport';
import { usePDFExport } from '../../hooks/usePDFExport';
import ProjectSwitcher from '../Mobile/ProjectSwitcher';
import ConfirmDialog from '../Common/ConfirmDialog';
import ProBadge from '../Common/ProBadge';
// import HelpModal from '../Common/HelpModal';
const HelpModal = React.lazy(() => import('../Common/HelpModal'));
const ProUpgradeDialog = React.lazy(() => import('../Common/ProUpgradeDialog'));
import MobileLibrarySheet from '../Mobile/MobileLibrarySheet';
import MobileEditSheet from '../Mobile/MobileEditSheet';
import MobileSmartSheet from '../Mobile/MobileSmartSheet';
import { importProjectBundle } from '../../utils/exportUtils';
import { saveImage } from '../../utils/imageStore';
import { v4 as uuidv4 } from 'uuid';
import { ViewportProvider } from '../../context/ViewportContext';
import { useProModal } from '../../context/ProContext';
import { useBugReporter } from '../../hooks/useBugReporter';

interface MobileLayoutProps {
    children: ReactNode;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, onUndo, onRedo, canUndo, canRedo }) => {
    const { currentProject, updateProject, addProject, projects, switchProject, currentProjectId, setProjectLoading } = useProject();
    const { shareProjectImage, exportToGwall, isExporting: isBusy } = useExport();
    const { exportToPDFGuide, isExporting: isPDFBusy, pdfReadyUrl, triggerPdfShare, clearPdfReady } = usePDFExport();
    const { isPro, isBeta } = useProModal();
    const { reportBug } = useBugReporter();

    const isExporting = isBusy || isPDFBusy;

    const [showSwitcher, setShowSwitcher] = useState(false);

    // Bottom Sheet States (Exclusive)
    const [activeSheet, setActiveSheet] = useState<'library' | 'smart' | 'edit' | 'menu' | null>(null);

    // Dialog States
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showPro, setShowPro] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to toggle sheet
    const toggleSheet = (sheet: 'library' | 'smart' | 'edit' | 'menu') => {
        if (activeSheet === sheet) {
            setActiveSheet(null);
        } else {
            setActiveSheet(sheet);
        }
    };

    // --- Menu Actions --- //

    const handleClearCanvasClick = () => {
        setActiveSheet(null);
        setShowClearConfirm(true);
    };

    const confirmClearCanvas = () => {
        if (currentProject) {
            updateProject(currentProject.id, { frames: [] });
        }
        setShowClearConfirm(false);
    };

    const handleSaveProject = async () => {
        setActiveSheet(null);
        await exportToGwall();
    };


    const handleImportClick = () => {
        setActiveSheet(null); // Close menu
        fileInputRef.current?.click(); // Trigger file input
    };

    const handleProjectImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setProjectLoading(true);
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
                await saveImage(img.id, img.blob, { skipOptimization: true });
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
            setProjectLoading(false);
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
                            <Logo stacked />
                        </div>

                        {/* Project Title / Switcher */}
                        <div
                            className={styles.projectTitle}
                            onClick={() => setShowSwitcher(true)}
                        >
                            <FolderOpen size={18} className={styles.titleIcon} />
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
                    <button className={`${styles.navItem} ${activeSheet === 'library' ? styles.active : ''}`} onClick={() => toggleSheet('library')}>
                        <Grid size={24} />
                        <span>Library</span>
                    </button>
                    <button className={`${styles.navItem} ${activeSheet === 'smart' ? styles.active : ''}`} onClick={() => toggleSheet('smart')}>
                        <Wand2 size={24} />
                        <span>Smart</span>
                    </button>
                    <button className={`${styles.navItem} ${activeSheet === 'edit' ? styles.active : ''}`} onClick={() => toggleSheet('edit')}>
                        <SlidersHorizontal size={24} />
                        <span>Edit</span>
                    </button>
                    <button className={`${styles.navItem} ${activeSheet === 'menu' ? styles.active : ''}`} onClick={() => toggleSheet('menu')}>
                        <Menu size={24} />
                        <span>Menu</span>
                    </button>
                </nav>

                <MobileLibrarySheet isOpen={activeSheet === 'library'} onClose={() => setActiveSheet(null)} />
                <MobileSmartSheet isOpen={activeSheet === 'smart'} onClose={() => setActiveSheet(null)} />
                <MobileEditSheet isOpen={activeSheet === 'edit'} onClose={() => setActiveSheet(null)} />

                {/* Overlays */}
                {showSwitcher && <ProjectSwitcher onClose={() => setShowSwitcher(false)} />}

                {/* Expanded Menu Overlay */}
                {activeSheet === 'menu' && (
                    <div className={styles.menuOverlay} onClick={() => setActiveSheet(null)}>
                        <div className={styles.menuSheet} onClick={e => e.stopPropagation()}>

                            <div className={styles.menuSectionLabel}>Account / Plan</div>
                            <div className={styles.statusItem}>
                                <div className={styles.statusInfo}>
                                    <span className={styles.statusLabel}>Current Plan:</span>
                                    <span className={(isPro || isBeta) ? styles.statusPro : styles.statusFree}>
                                        {isBeta ? 'Early Beta' : (isPro ? 'Pro' : 'Free')}
                                    </span>
                                </div>
                                {(isPro || isBeta) && <Sparkles size={16} style={{ color: '#a855f7' }} />}
                            </div>

                            {!isPro && (
                                <div
                                    className={styles.proSection}
                                    title="During beta, Pro features are unlocked for free."
                                    onClick={() => { setActiveSheet(null); setShowPro(true); }}
                                    style={{ cursor: 'pointer', opacity: 1 }}
                                >
                                    <div className={styles.proBadge}>
                                        <Sparkles size={16} />
                                        <span>Upgrade to Pro</span>
                                    </div>
                                    <div className={styles.proLabel}>
                                        {isBeta ? 'All Pro features are free during beta!' : 'Unlock premium features'}
                                    </div>
                                </div>
                            )}

                            <div className={styles.menuSectionLabel}>Export</div>
                            <div className={styles.menuItem} onClick={() => { setActiveSheet(null); shareProjectImage(); }}>
                                <Share2 size={16} style={{ marginRight: 8 }} />
                                Share Snapshot
                            </div>
                            <div className={styles.menuItem} onClick={handleSaveProject}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
                                    <Save size={16} style={{ marginRight: 8 }} />
                                    <span>Save Project File (.gwall)</span>
                                    <ProBadge isOverlay style={{ position: 'absolute', right: 0 }} />
                                </div>
                            </div>
                            <div className={styles.menuItem} onClick={() => { setActiveSheet(null); exportToPDFGuide(); }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
                                    <Printer size={16} style={{ marginRight: 8 }} />
                                    <span>Export Hanging Guide (PDF)</span>
                                    <ProBadge isOverlay style={{ position: 'absolute', right: 0 }} />
                                </div>
                            </div>

                            <div className={styles.menuSectionLabel}>System</div>
                            <div className={styles.menuItem} onClick={handleImportClick}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
                                    <FolderOpen size={16} style={{ marginRight: 8 }} />
                                    <span>Import Project (.gwall)</span>
                                    <ProBadge isOverlay style={{ position: 'absolute', right: 0 }} />
                                </div>
                            </div>
                            <div className={styles.menuItem} onClick={() => { setActiveSheet(null); reportBug(); }}>
                                <Bug size={16} style={{ marginRight: 8 }} />
                                Report an Issue (Beta)
                            </div>
                            <div className={styles.menuItem} onClick={() => { setActiveSheet(null); setShowHelp(true); }}>
                                <CircleHelp size={16} style={{ marginRight: 8 }} />
                                Help & Guide
                            </div>
                            <div className={`${styles.menuItem} ${styles.danger}`} onClick={handleClearCanvasClick}>
                                <Eraser size={16} style={{ marginRight: 8 }} />
                                Clear Canvas
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '8px' }}>
                                <Link
                                    to="/changelog"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveSheet(null)}
                                    style={{ textDecoration: 'none', color: '#8e8e93', fontSize: '11px', opacity: 0.7 }}
                                >
                                    Gallery Planner v{pkg.version} beta
                                </Link>
                            </div>

                            <div className={styles.menuCancel} onClick={() => setActiveSheet(null)}>Cancel</div>
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

                {showHelp && (
                    <React.Suspense fallback={null}>
                        <HelpModal onClose={() => setShowHelp(false)} />
                    </React.Suspense>
                )}

                {showPro && (
                    <React.Suspense fallback={null}>
                        <ProUpgradeDialog onClose={() => setShowPro(false)} />
                    </React.Suspense>
                )}

                {isExporting && createPortal(
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                        <p>{isPDFBusy ? 'Preparing Hanging Guide...' : 'Preparing...'}</p>
                    </div>,
                    document.body
                )}

                {pdfReadyUrl && createPortal(
                    <div className={styles.loadingOverlay}>
                        <div className={styles.readyCard}>
                            <h3>Guide Ready!</h3>
                            <p>Hanging guide is generated.</p>
                            <div className={styles.readyActions}>
                                <button className={styles.primaryBtn} onClick={triggerPdfShare}>
                                    <Printer size={18} style={{ marginRight: 8 }} />
                                    View / Print Guide
                                </button>
                                <button className={styles.secondaryBtn} onClick={clearPdfReady}>
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </ViewportProvider>
    );
};
