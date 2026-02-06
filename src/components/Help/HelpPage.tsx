import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HelpPage.module.css';
import Logo from '../Header/Logo';
import {
    Grid3x3,
    Image,
    MousePointer2,
    Sparkles,
    Keyboard,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

const HelpPage: React.FC = () => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logoArea}>
                    <Logo />
                </div>
                <nav className={styles.nav}>
                    <Link to="/" className={styles.navLink}>Home</Link>
                    <Link to="/app" className={styles.ctaBtn}>Launch App</Link>
                </nav>
            </header>

            <main className={styles.content}>
                <div className={styles.hero}>
                    <h1>User Manual & Guide</h1>
                    <p className={styles.intro}>
                        Master the powerful layout tools in GalleryPlanner. From inventory management to smart algorithms, here is everything you need to know.
                    </p>
                </div>

                <div className={styles.alert}>
                    <strong>BETA NOTICE:</strong> &nbsp; GalleryPlanner is currently in Early Beta. All PRO features are completely free to use while we refine the application.
                </div>

                <div className={styles.cardGrid}>
                    {/* Inventory */}
                    <section id="inventory" className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper}>
                                <Grid3x3 size={24} />
                            </div>
                            <h2>Inventory & Frame Management</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <p>GalleryPlanner treats every frame as a physical entity in your personal "library," ensuring you never lose track of dimensions.</p>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Adaptive Grid Inventory</strong>
                                        <span>The sidebar shifts between list and grid views to maximize screen space. Frames on the wall are clearly marked "Placed".</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>1:1 Manifest Logic</strong>
                                        <span>Every frame is accounted for individually. Removing a frame returns it to your "Unplaced" inventory.</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Smart Importing</strong>
                                        <span>Batch import by pasting text (e.g., "8x10, 11x14") or use the Common Size Picker for instant standard sizes.</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Aesthetics & Customization</strong>
                                        <span>Label frames (e.g., "Wedding Photo"), try Rounds/Ovals, and adjust matting borders that grow outward to preserve inner dimensions.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Photos */}
                    <section id="photos" className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper}>
                                <Image size={24} />
                            </div>
                            <h2>Photo Management</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Masonry Photo Library</strong>
                                        <span>A high-efficiency grid for managing all your uploaded assets.</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Drag & Drop Workflow</strong>
                                        <span>Drag image files from your desktop onto any frame, or from the library sidebar.</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Fine-Tuning</strong>
                                        <span>Use the photo adjustment tab to scale, position, and rotate images within their frames.</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>High-Res Export</strong>
                                        <span>Export all cropped photos into a high-resolution ZIP file ready for printing.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Workspace */}
                    <section id="workspace" className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper}>
                                <MousePointer2 size={24} />
                            </div>
                            <h2>Workspace Interaction</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Advanced Controls</strong>
                                        <span>On-canvas controls (Glass HUD) for zoom/grid. Right-click for layering (Bring to Front/Back).</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Smart Snapping</strong>
                                        <span>Align frames to a grid or to each other's edges using the alignment tools.</span>
                                    </div>
                                </li>
                                <li className={styles.featureItem}>
                                    <CheckCircle2 size={18} className={styles.checkIcon} />
                                    <div className={styles.featureText}>
                                        <strong>Staircase Wall Support</strong>
                                        <span>Design for staircase walls by setting a <strong>Rise (%)</strong> to match your exact slope.</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Layout Engine */}
                    <section id="layout" className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper}>
                                <Sparkles size={24} />
                            </div>
                            <h2>Smart Layout Engine</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <p>Don't suffer from "blank wall syndrome." Let the algorithms do the heavy lifting.</p>
                            <ul className={styles.featureList}>
                                <li className={styles.featureItem}>
                                    <ArrowRight size={18} className={styles.checkIcon} style={{ color: '#8e8e93' }} />
                                    <div className={styles.featureText}><strong>Masonry</strong>: Tightly packed, organic grid.</div>
                                </li>
                                <li className={styles.featureItem}>
                                    <ArrowRight size={18} className={styles.checkIcon} style={{ color: '#8e8e93' }} />
                                    <div className={styles.featureText}><strong>Grid</strong>: Strict, uniform alignment.</div>
                                </li>
                                <li className={styles.featureItem}>
                                    <ArrowRight size={18} className={styles.checkIcon} style={{ color: '#8e8e93' }} />
                                    <div className={styles.featureText}><strong>Skyline</strong>: Bottom-aligned "cityscape" look for mantels.</div>
                                </li>
                                <li className={styles.featureItem}>
                                    <ArrowRight size={18} className={styles.checkIcon} style={{ color: '#8e8e93' }} />
                                    <div className={styles.featureText}><strong>Spiral</strong>: Artistic, center-outward flow.</div>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Shortcuts */}
                    <section id="shortcuts" className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.iconWrapper}>
                                <Keyboard size={24} />
                            </div>
                            <h2>Shortcuts Reference</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Shortcut</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>View</strong></td>
                                            <td>Right-Click + Drag</td>
                                            <td>Pan Workspace</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td><kbd>Ctrl</kbd> + Scroll</td>
                                            <td>Zoom In/Out</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td><kbd>#</kbd></td>
                                            <td>Toggle Background Grid</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td><kbd>S</kbd></td>
                                            <td>Toggle Snap-to-Grid</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Selection</strong></td>
                                            <td><kbd>Ctrl</kbd> + <kbd>A</kbd></td>
                                            <td>Select All</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td>Click + Drag</td>
                                            <td>Marquee selection</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Edit</strong></td>
                                            <td><kbd>Ctrl</kbd> + <kbd>D</kbd></td>
                                            <td>Duplicate Selection</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td><kbd>Ctrl</kbd> + Drag</td>
                                            <td>Quick Duplicate and Move</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td><kbd>Arrows</kbd></td>
                                            <td>Nudge 1px (<kbd>Shift</kbd> for 10px)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className={styles.footer}>
                    © 2026 Timothy Straub. Built with precision for beautiful homes.
                </footer>
            </main>
        </div>
    );
};

export default HelpPage;
