import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import Logo from '../Header/Logo';
import WebsiteFooter from '../Layout/WebsiteFooter';
import BackToTop from '../Common/BackToTop';
import { Sparkles, LayoutGrid, CheckCircle2, Image } from 'lucide-react';
import { trackEvent, LANDING_EVENTS } from '../../utils/analytics';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const LandingPage: React.FC = () => {
    const [featuresRef, featuresVisible] = useIntersectionObserver({ threshold: 0.2 });
    const [proRef, proVisible] = useIntersectionObserver({ threshold: 0.2 });

    useEffect(() => {
        if (featuresVisible) trackEvent(LANDING_EVENTS.VIEW_FEATURES);
    }, [featuresVisible]);

    useEffect(() => {
        if (proVisible) trackEvent(LANDING_EVENTS.VIEW_PRO);
    }, [proVisible]);

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logoArea}>
                    <Logo hideStatus scale={1.3} />
                </div>
                <nav className={styles.nav}>
                    <a href="#features">Features</a>
                    <a href="#pro">Pro</a>
                    <Link
                        to="/app"
                        className={styles.ctaBtn}
                        onClick={() => trackEvent(LANDING_EVENTS.NAV_LAUNCH)}
                    >
                        Launch App
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main>
                {/* Hero */}
                <section className={styles.hero}>
                    <span className={styles.betaBadge}>PUBLIC BETA</span>
                    <h1>Visualize your perfect wall,<br />before you hammer a nail.</h1>
                    <p>
                        Design complex gallery layouts with real frames and personal photos.
                        Get instant measurements and professional hanging guides.
                    </p>
                    <div className={styles.heroActions}>
                        <Link
                            to="/app"
                            className={`${styles.ctaBtn} ${styles.mainCta}`}
                            onClick={() => trackEvent(LANDING_EVENTS.HERO_CTA)}
                        >
                            Start Designing Free
                        </Link>
                    </div>
                    <img
                        src="/gallery-planner.webp"
                        srcSet="/gallery-planner_mobile.webp 800w, /gallery-planner.webp 1200w"
                        sizes="(max-width: 768px) 100vw, 800px"
                        alt="GalleryPlanner Workspace"
                        className={styles.heroScreenshot}
                        fetchPriority="high"
                        loading="eager"
                        width="1200"
                        height="800"
                    />
                </section>

                {/* How It Works */}
                <section className={styles.features} style={{ background: '#fff', paddingBottom: '0' }}>
                    <div className={styles.sectionHeader}>
                        <h2>How it Works</h2>
                        <p>Go from pile-of-frames to perfect wall in minutes.</p>
                    </div>

                    <div className={styles.featureRow} style={{ maxWidth: '1000px' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    background: '#f2f2f7', color: '#1c1c1e', width: '40px', height: '40px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '18px', flexShrink: 0
                                }}>1</div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Upload & Measure</h3>
                                    <p style={{ color: '#636366', lineHeight: '1.5' }}>
                                        Input your wall dimensions and add your frames. Use our presets or enter custom sizes.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    background: '#f2f2f7', color: '#1c1c1e', width: '40px', height: '40px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '18px', flexShrink: 0
                                }}>2</div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Design & Arrange</h3>
                                    <p style={{ color: '#636366', lineHeight: '1.5' }}>
                                        Drag, drop, and align. Use AI layouts to find the perfect fit for your collection.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    background: '#007aff', color: 'white', width: '40px', height: '40px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '18px', flexShrink: 0
                                }}>3</div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Hang with Confidence</h3>
                                    <p style={{ color: '#636366', lineHeight: '1.5' }}>
                                        Export a PDF guide with exact coordinates for every nail. No more Swiss-cheese walls.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.featureImageWrapper} ${styles.hangingGuide}`} style={{ flex: 1, maxWidth: '400px' }}>
                            <img
                                src="/hanging_guide.webp"
                                srcSet="/hanging_guide_mobile.webp 800w, /hanging_guide.webp 1200w"
                                sizes="(max-width: 768px) 100vw, 600px"
                                alt="Hanging Guide PDF Example"
                                className={styles.featureImage}
                                loading="lazy"
                                width="1200"
                                height="800"
                            />
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className={styles.features} id="features" ref={featuresRef as any}>
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
                        <div className={styles.featureImageWrapper}>
                            <img
                                src="/smart_layout.webp"
                                srcSet="/smart_layout_mobile.webp 800w, /smart_layout.webp 1200w"
                                sizes="(max-width: 768px) 100vw, 600px"
                                alt="AI Layout Engine"
                                className={styles.featureImage}
                                loading="lazy"
                                width="1200"
                                height="800"
                            />
                        </div>
                    </div>

                    <div className={styles.featureRow}>
                        <div className={styles.featureText}>
                            <h3><LayoutGrid className={styles.checkIcon} /> Real Inventory</h3>
                            <p>
                                Plan with the frames you actually own. Mix and match standard sizes
                                like 8x10 and 5x7, or create custom dimensions for your unique pieces.
                            </p>
                        </div>
                        <div className={styles.featureImageWrapper}>
                            <img
                                src="/frames_library.webp"
                                srcSet="/frames_library_mobile.webp 800w, /frames_library.webp 1200w"
                                sizes="(max-width: 768px) 100vw, 600px"
                                alt="Frame Inventory Library"
                                className={styles.featureImage}
                                loading="lazy"
                                width="1200"
                                height="800"
                            />
                        </div>
                    </div>

                    <div className={styles.featureRow}>
                        <div className={styles.featureText}>
                            <h3><Image className={styles.checkIcon} /> Curate Your Collection</h3>
                            <p>
                                Place the photos you have where you want them. Plan not just the frames,
                                but visual harmony of the art inside them.
                            </p>
                        </div>
                        <div className={styles.featureImageWrapper}>
                            <img
                                src="/photo_library.webp"
                                srcSet="/photo_library_mobile.webp 800w, /photo_library.webp 1200w"
                                sizes="(max-width: 768px) 100vw, 600px"
                                alt="Photo Management"
                                className={styles.featureImage}
                                loading="lazy"
                                width="1200"
                                height="800"
                            />
                        </div>
                    </div>
                </section>

                {/* Mobile App Section */}
                <section className={styles.features} style={{ background: '#fff' }}>
                    <div className={styles.sectionHeader}>
                        <h2>Plan anywhere, anytime.</h2>
                        <p>GalleryPlanner is optimized for your pocket.</p>
                    </div>

                    <div className={styles.featureRow}>
                        <div className={styles.featureImageWrapper} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                            <img
                                src="/mobile_app.webp"
                                alt="GalleryPlanner Mobile"
                                className={styles.featureImage}
                                style={{ objectFit: 'contain' }}
                                loading="lazy"
                                width="400"
                                height="800"
                            />
                        </div>
                        <div className={styles.featureText}>
                            <div style={{ marginBottom: '40px' }}>
                                <h3><span className={styles.iconCircle}>📱</span> Touch-Optimized</h3>
                                <p>
                                    A native-feeling interface designed for your thumbs. Pinch to zoom, drag to arrange, and tap to snap.
                                </p>
                            </div>
                            <div style={{ marginBottom: '40px' }}>
                                <h3><span className={styles.iconCircle}>🔄</span> Seamless Handoff</h3>
                                <p>
                                    Start designing on the couch, save your project, and finish refining the specific measurements on your desktop.
                                </p>
                            </div>
                            <div>
                                <h3><span className={styles.iconCircle}>📏</span> Pocket Reference</h3>
                                <p>
                                    At the store and need to know if that 11x14 frame fits? Pull up your layout instantly to visualize it.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pro Section */}
                <section className={styles.proSection} id="pro" ref={proRef as any}>
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

                        <Link
                            to="/app"
                            className={`${styles.ctaBtn} ${styles.mainCta}`}
                            onClick={() => trackEvent(LANDING_EVENTS.PRO_SECTION_CTA)}
                        >
                            Get Started Now
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <WebsiteFooter />
            <BackToTop />
        </div >
    );
};

export default LandingPage;
