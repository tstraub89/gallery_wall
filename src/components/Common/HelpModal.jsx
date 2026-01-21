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
                    <section>
                        <h3>🎨 The Basics</h3>
                        <ul>
                            <li><strong>Setup Your Wall:</strong> Use the right sidebar to change your wall size and color.</li>
                            <li><strong>Add Frames:</strong> Drag frames from the left library onto your canvas.</li>
                            <li><strong>Add Photos:</strong> Drag and drop any image file from your computer directly onto a frame.</li>
                            <li><strong>Scale & Rotate:</strong> Select a frame and use the properties panel to tweak its dimensions.</li>
                        </ul>
                    </section>

                    <section>
                        <h3>🧭 Navigation</h3>
                        <ul>
                            <li><strong>Pan:</strong> Right-click and drag (or middle-click) to move around the workspace.</li>
                            <li><strong>Zoom:</strong> Hold <code>Ctrl / Meta</code> and use your mouse wheel to zoom in and out.</li>
                        </ul>
                    </section>

                    <section>
                        <h3>🚀 Pro Features</h3>
                        <ul>
                            <li><strong>Smart Duplicate:</strong> Hold <code>Ctrl / Meta</code> while dragging a frame to spawn an instant copy.</li>
                            <li><strong>Layering:</strong> Right-click a frame to bring it to the front or send it to the back.</li>
                            <li><strong>Bulk Select:</strong> Left-click and drag on the background to use the marquee selector.</li>
                        </ul>
                    </section>

                    <section>
                        <h3>⌨️ Shortcuts</h3>
                        <div className={styles.shortcutGrid}>
                            <div className={styles.shortcutItem}><kbd>Ctrl</kbd> + <kbd>D</kbd> <span>Duplicate Selected</span></div>
                            <div className={styles.shortcutItem}><kbd>Ctrl</kbd> + <kbd>Z</kbd> <span>Undo Action</span></div>
                            <div className={styles.shortcutItem}><kbd>Delete</kbd> <span>Remove Frame</span></div>
                            <div className={styles.shortcutItem}><kbd>S</kbd> <span>Toggle Snapping</span></div>
                            <div className={styles.shortcutItem}><kbd>#</kbd> <span>Toggle Grid</span></div>
                            <div className={styles.shortcutItem}><kbd>Arrows</kbd> <span>Nudge 1px</span></div>
                            <div className={styles.shortcutItem}><kbd>Shift</kbd> + <kbd>Arrows</kbd> <span>Nudge 10px</span></div>
                        </div>
                    </section>
                </div>

                <footer className={styles.footer}>
                    <button className={styles.primaryBtn} onClick={onClose}>Got it!</button>
                </footer>
            </div>
        </div>
    );
};

export default HelpModal;
