import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import styles from './HelpModal.module.css';
import { useProject } from '../../hooks/useProject';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Sparkles, ExternalLink } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const { importDemoProject } = useProject();
    const [isLoadingDemo, setIsLoadingDemo] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleLoadDemo = async () => {
        setIsLoadingDemo(true);
        try {
            await importDemoProject();
            onClose();
        } catch (err) {
            console.error('Failed to load demo:', err);
            alert('Failed to load demo project. Please try again.');
        } finally {
            setIsLoadingDemo(false);
        }
    };

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>{isMobile ? 'Mobile Guide' : 'Quick Start Guide'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </header>

                <div className={styles.content}>
                    {!isMobile ? (
                        /* DESKTOP CONTENT */
                        <>
                            <div className={styles.column}>
                                <section>
                                    <h3>🎨 The Basics</h3>
                                    <ul>
                                        <li><strong>Wall Setup:</strong> Use the right sidebar to set dimensions, color, and wall type. For staircase walls, adjust the <em>Rise (%)</em> to match your slope.</li>
                                        <li><strong>Adding Frames:</strong> Select a common size (e.g., 4x6, 5x7) from the library (left) or create a custom frame.</li>
                                        <li><strong>Photos:</strong> Drag and drop any image file from your computer directly onto a frame.</li>
                                        <li><strong>Scale & Rotate:</strong> Use the properties panel (right) to tweak dimensions or rotation.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3>🧭 Navigation</h3>
                                    <ul>
                                        <li><strong>Pan:</strong> Right-click and drag (or middle-click) to move around the workspace.</li>
                                        <li><strong>Zoom:</strong> Hold <kbd>Ctrl</kbd> / <kbd>Meta</kbd> and use your mouse wheel to zoom in and out.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3>💾 Persistence</h3>
                                    <ul>
                                        <li><strong>Auto-Save:</strong> Your changes are automatically saved to your browser's local storage.</li>
                                        <li><strong>Portability:</strong> Use the "Export Project" menu to save a <code>.gwall</code> file that includes all your photos.</li>
                                        <li><strong>Outputs:</strong> Export high-res photos for printing or a PNG for sharing your vision.</li>
                                    </ul>
                                </section>
                            </div>

                            <div className={styles.column}>
                                <section>
                                    <h3>🚀 Pro Features</h3>
                                    <ul>
                                        <li><strong>Smart Layout:</strong> Stuck on what frame goes where? Use 'Auto-Arrange' to instantly organize your wall.</li>
                                        <li><strong>Locking:</strong> Right-click a frame to <strong>Lock</strong> it in place so it can't be moved.</li>
                                        <li><strong>Smart Duplicate:</strong> Hold <kbd>Ctrl</kbd> / <kbd>Meta</kbd> while dragging a frame to spawn an instant copy.</li>
                                        <li><strong>Layering:</strong> Right-click a frame to bring it to the front or send it to the back.</li>
                                        <li><strong>Bulk Select:</strong> Left-click and drag on the background to use the marquee selector.</li>
                                        <li><strong>Snap & Grid:</strong> Toggle snapping (<code>S</code>) and the grid (<code>#</code>) for precise alignment.</li>
                                    </ul>
                                </section>

                                <section className={styles.shortcutsSection}>
                                    <h3>⌨️ Shortcuts</h3>
                                    <div className={styles.shortcutGrid}>
                                        <div className={styles.shortcutItem}><kbd>Ctrl</kbd> + <kbd>A</kbd> <span>Select All</span></div>
                                        <div className={styles.shortcutItem}><kbd>Ctrl</kbd> + <kbd>D</kbd> <span>Duplicate</span></div>
                                        <div className={styles.shortcutItem}><kbd>Ctrl</kbd> + <kbd>Z</kbd> <span>Undo</span></div>
                                        <div className={styles.shortcutItem}><kbd>Ctrl</kbd> + <kbd>Y</kbd> <span>Redo</span></div>
                                        <div className={styles.shortcutItem}><kbd>Del</kbd> / <kbd>⌫</kbd> <span>Remove</span></div>
                                        <div className={styles.shortcutItem}><kbd>S</kbd> <span>Snapping</span></div>
                                        <div className={styles.shortcutItem}><kbd>#</kbd> <span>Grid</span></div>
                                        <div className={styles.shortcutItem}><kbd>Esc</kbd> <span>Deselect</span></div>
                                        <div className={styles.shortcutItem}><kbd>Arrows</kbd> <span>Nudge 1px</span></div>
                                        <div className={styles.shortcutItem}><kbd>Shift</kbd>+<kbd>Arr</kbd> <span>Nudge 10px</span></div>
                                    </div>
                                </section>
                            </div>
                        </>
                    ) : (
                        /* MOBILE CONTENT */
                        <>
                            <div className={styles.column}>
                                <section>
                                    <h3>🎨 Touch Controls</h3>
                                    <ul>
                                        <li><strong>Adding Frames:</strong> Tap <strong>Library</strong>, then add a <strong>Common Size</strong> or <strong>+ Custom</strong> frame.</li>
                                        <li><strong>Photos:</strong> Tap <strong>Library</strong>, switch to the <strong>Photos</strong> tab, and tap <strong>Add Photos</strong>.</li>
                                        <li><strong>Context Menu:</strong> Long press a frame to <strong>Lock</strong>, Layer, or Delete.</li>
                                        <li><strong>Properties:</strong> Tap any frame, then tap "Edit" to change matting, border, or rotate.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3>👆 Gestures</h3>
                                    <ul>
                                        <li><strong>Pan:</strong> Drag with one finger on the background to move the wall.</li>
                                        <li><strong>Zoom:</strong> Pinch with two fingers to zoom in and out.</li>
                                        <li><strong>Select:</strong> Tap a frame to select it. Tap again to deselect.</li>
                                        <li><strong>Move Frame:</strong> Drag a selected frame to move it.</li>
                                    </ul>
                                </section>
                            </div>

                            <div className={styles.column}>
                                <section>
                                    <h3>💾 Saving & Exporting</h3>
                                    <ul>
                                        <li><strong>Share Image:</strong> Open the <strong>Menu</strong> (bottom right) and tap <strong>Share Image</strong> to save a picture of your wall.</li>
                                        <li><strong>Save Project:</strong> Use <strong>Menu &gt; Save Project File</strong> to download a backup (.gwall).</li>
                                        <li><strong>Switching:</strong> Tap the project name (top center) to switch between different walls.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h3>🚀 Tips</h3>
                                    <ul>
                                        <li><strong>Smart Layout:</strong> Stuck on what frame goes where? Let Auto-Arrange instantly organize your gallery wall for you!</li>
                                        <li><strong>Landscape:</strong> Rotate your phone for a wider view of your wall.</li>
                                        <li><strong>Wall Setup:</strong> Tap "Edit" (with no frame selected) to change wall size, type, color, and slope.</li>
                                    </ul>
                                </section>
                            </div>
                        </>
                    )}
                </div>

                <footer className={styles.footer}>
                    <div className={styles.footerActions}>
                        {!isMobile && (
                            <Link
                                to="/help"
                                target="_blank"
                                className={styles.textLinkBtn}
                            >
                                <span>View Full User Manual</span>
                                <ExternalLink size={14} />
                            </Link>
                        )}

                        <button
                            className={styles.secondaryBtn}
                            onClick={handleLoadDemo}
                            disabled={isLoadingDemo}
                        >
                            <Sparkles size={16} />
                            {isLoadingDemo ? 'Loading...' : 'Load Demo Wall'}
                        </button>

                        {isMobile && (
                            <Link
                                to="/help"
                                target="_blank"
                                className={styles.textLinkBtn}
                            >
                                <span>View Full User Manual</span>
                                <ExternalLink size={14} />
                            </Link>
                        )}
                    </div>

                    <div className={styles.footerMeta}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <a
                                href="https://github.com/tstraub89/gallery_wall"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.githubLink}
                                title="View Source on GitHub"
                                style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', padding: '4px' }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                    <path d="M9 18c-4.51 2-5-2-7-2" />
                                </svg>
                            </a>
                            <a
                                href="https://www.buymeacoffee.com/tstraub89"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                                    alt="Buy Me A Coffee"
                                    style={{ height: '30px', width: 'auto', display: 'block' }}
                                />
                            </a>
                        </div>
                        <span style={{ fontSize: '10px', color: '#999', textAlign: 'right' }}>
                            v{__APP_VERSION__} beta
                            <br />
                            {new Date(__BUILD_TIME__).toLocaleString()}
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default HelpModal;
