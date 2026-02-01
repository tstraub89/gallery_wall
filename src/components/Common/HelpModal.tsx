import React, { useEffect, useState } from 'react';
import styles from './HelpModal.module.css';
import { useProject } from '../../hooks/useProject';
import { Sparkles } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const { importDemoProject } = useProject();
    const [isLoadingDemo, setIsLoadingDemo] = useState(false);

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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>Quick Start Guide</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </header>

                <div className={styles.content}>
                    <div className={styles.column}>
                        <section>
                            <h3>🎨 The Basics</h3>
                            <ul>
                                <li><strong>Wall Setup:</strong> Use the right sidebar to set dimensions, color, and wall type. For staircase walls, adjust the <em>Rise (%)</em> to match your slope.</li>
                                <li><strong>Adding Frames:</strong> Select a frame from the library (left) to add it to your wall.</li>
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
                </div>

                <footer className={styles.footer}>
                    <a
                        href="https://github.com/tstraub89/gallery_wall"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.githubLink}
                        title="View Source on GitHub"
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginRight: '16px' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                            <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                    </a>
                    <a
                        href="https://www.buymeacoffee.com/tstraub89"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginRight: 'auto' }}
                    >
                        <img
                            src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                            alt="Buy Me A Coffee"
                            style={{ height: '40px', width: 'auto', display: 'block' }}
                        />
                    </a>
                    <button
                        className={styles.secondaryBtn}
                        onClick={handleLoadDemo}
                        disabled={isLoadingDemo}
                    >
                        <Sparkles size={16} />
                        {isLoadingDemo ? 'Loading...' : 'Load Demo Wall'}
                    </button>
                    <button className={styles.primaryBtn} onClick={onClose}>Got it!</button>
                </footer>
            </div>
        </div>
    );
};

export default HelpModal;

