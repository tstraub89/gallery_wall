import React, { useEffect } from 'react';
import styles from './HelpModal.module.css';

const HelpModal = ({ onClose }) => {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

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
                                <li><strong>Wall Setup:</strong> Use the right sidebar to change dimensions, color, and wall type (Straight or Staircase).</li>
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

                        <section>
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
                    <button className={styles.primaryBtn} onClick={onClose}>Got it!</button>
                </footer>
            </div>
        </div>
    );
};

export default HelpModal;
