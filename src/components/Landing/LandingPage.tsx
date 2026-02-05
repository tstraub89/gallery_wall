import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import Logo from '../Header/Logo';
import { Sparkles, LayoutGrid, Ruler, CheckCircle2 } from 'lucide-react';

const LandingPage: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logoArea}>
                    <Logo hideStatus />
                </div>
                <nav className={styles.nav}>
                    <a href="#features">Features</a>
                    <a href="#pro">Pro</a>
                    <Link to="/app" className={styles.ctaBtn}>Launch App</Link>
                </nav>
            </header>

            {/* Hero */}
            <section className={styles.hero}>
                <span className={styles.betaBadge}>PUBLIC BETA</span>
                <h1>Visualize your perfect wall,<br />before you hammer a nail.</h1>
                <p>
                    Design complex gallery layouts with real frames and personal photos. 
                    Get instant measurements and professional hanging guides.
                </p>
                <div className={styles.heroActions}>
                    <Link to="/app" className={`${styles.ctaBtn} ${styles.mainCta}`}>Start Designing Free</Link>
                </div>
                <img 
                    src="/gallery-planner.png" 
                    alt="GalleryPlanner Workspace" 
                    className={styles.heroScreenshot} 
                />
            </section>

            {/* Features */}
            <section className={styles.features} id="features">
                <div className={styles.sectionHeader}>
                    <h2>Professional tools for your home.</h2>
                    <p>Stop guessing and start planning with precision.</p>
                </div>

                <div className={styles.featureRow}>
                    <div className={styles.featureText}>
                        <h3><Sparkles className={styles.checkIcon} /> AI-Assisted Layouts</h3>
                        <p>
                            Stuck on what goes where? Let our smart engines (Masonry, Grid, Skyline, and more) 
                            propose the perfect arrangement based on your frame inventory.
                        </p>
                    </div>
                    <img src="/smart_layout.png" alt="AI Layout Engine" className={styles.featureImage} />
                </div>

                <div className={styles.featureRow}>
                    <div className={styles.featureText}>
                        <h3><LayoutGrid className={styles.checkIcon} /> Real Inventory</h3>
                        <p>
                            Plan with the frames you actually own. Mix and match standard sizes 
                            like 8x10 and 5x7, or create custom dimensions for your unique pieces.
                        </p>
                    </div>
                    <img src="/frames_library.png" alt="Frame Inventory Library" className={styles.featureImage} />
                </div>

                <div className={styles.featureRow}>
                    <div className={styles.featureText}>
                        <h3><Ruler className={styles.checkIcon} /> Exact Measurements</h3>
                        <p>
                            No more swiss-cheese walls. See exactly where every nail needs to go 
                            with a coordinate system that translates digital pixels to real-world inches.
                        </p>
                    </div>
                    <img src="/photo_library.png" alt="Photo Management" className={styles.featureImage} />
                </div>
            </section>

            {/* Pro Section */}
            <section className={styles.proSection} id="pro">
                <div className={styles.proCard}>
                    <h2>Unlock Pro features for free.</h2>
                    <p>We are currently in early beta. Claim free lifetime access to core premium features while we build out the platform.</p>
                    
                    <div className={styles.checkGrid}>
                        <div className={styles.checkItem}><CheckCircle2 className={styles.checkIcon} /> AI Smart Layouts</div>
                        <div className={styles.checkItem}><CheckCircle2 className={styles.checkIcon} /> PDF Hanging Guides</div>
                        <div className={styles.checkItem}><CheckCircle2 className={styles.checkIcon} /> High-Res Photo Export</div>
                        <div className={styles.checkItem}><CheckCircle2 className={styles.checkIcon} /> Multi-Project Support</div>
                        <div className={styles.checkItem}><CheckCircle2 className={styles.checkIcon} /> Staircase Wall Mode</div>
                        <div className={styles.checkItem}><CheckCircle2 className={styles.checkIcon} /> Custom Frame Shapes</div>
                    </div>

                    <Link to="/app" className={`${styles.ctaBtn} ${styles.mainCta}`}>Get Started Now</Link>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <Logo hideStatus />
                    <div className={styles.copyright}>
                        © 2026 Timothy Straub. Built with precision for beautiful homes.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
