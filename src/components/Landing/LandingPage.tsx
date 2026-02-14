import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';
import Logo from '../Header/Logo';
import WebsiteFooter from '../Layout/WebsiteFooter';
import BackToTop from '../Common/BackToTop';
import { Sparkles, LayoutGrid, CheckCircle2, Image } from 'lucide-react';
import { trackEvent, LANDING_EVENTS } from '../../utils/analytics';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import LandingCarousel from './LandingCarousel';
import AutoplayVideo from '../Common/AutoplayVideo';
import FeaturedResources from './FeaturedResources';

const SMART_LAYOUT_VIDEO = "/smart-layout.mp4";
const ADD_PHOTOS_VIDEO = "/add-photos.mp4";

const LandingPage: React.FC = () => {
    const [featuresRef, featuresVisible] = useIntersectionObserver({ threshold: 0.2 });
    const [proRef, proVisible] = useIntersectionObserver({ threshold: 0.2 });

    // Carousel State
    const [carouselIndex, setCarouselIndex] = React.useState(0);

    // Auto-advance carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % 3);
        }, 8000); // Slower: 8 seconds per slide
        return () => clearInterval(interval);
    }, [carouselIndex]); // Reset timer on manual interaction if we wanted, but simple loop is fine

    useEffect(() => {
        if (featuresVisible) trackEvent(LANDING_EVENTS.VIEW_FEATURES);
    }, [featuresVisible]);

    useEffect(() => {
        if (proVisible) trackEvent(LANDING_EVENTS.VIEW_PRO);
    }, [proVisible]);

    // Set Page Title & Meta on Mount
    useEffect(() => {
        document.title = "GalleryPlanner™ | Free Gallery Wall Layout Tool";
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', "Visualize your perfect wall before you hammer a nail. Design complex gallery layouts with real frames and personal photos.");
        }
    }, []);

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logoArea}>
                    <Logo hideStatus scale={1.3} />
                </div>
                <nav className={styles.nav}>
                    <a href="#features">Features</a>
                    <a href="#resources">Learn</a>
                    <a href="#pro">Pro</a>
                </nav>
                <Link
                    to="/app"
                    className={styles.ctaBtn}
                    onClick={() => trackEvent(LANDING_EVENTS.NAV_LAUNCH)}
                >
                    <span className={styles.mobileText}>App</span>
                    <span className={styles.desktopText}>Launch App</span>
                </Link>
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

                    <div className={styles.featureRow} style={{ maxWidth: '1200px', gap: '40px' }}>
                        <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    background: carouselIndex === 0 ? '#005bb7' : '#f2f2f7',
                                    color: carouselIndex === 0 ? 'white' : '#1c1c1e',
                                    width: '40px', height: '40px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '18px', flexShrink: 0,
                                    cursor: 'pointer', transition: 'all 0.3s ease'
                                }} onClick={() => setCarouselIndex(0)}>1</div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Upload & Measure</h3>
                                    <p style={{ color: '#636366', lineHeight: '1.5' }}>
                                        Input your wall dimensions and add your frames. Use our presets or enter custom sizes.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    background: carouselIndex === 1 ? '#005bb7' : '#f2f2f7',
                                    color: carouselIndex === 1 ? 'white' : '#1c1c1e',
                                    width: '40px', height: '40px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '18px', flexShrink: 0,
                                    cursor: 'pointer', transition: 'all 0.3s ease'
                                }} onClick={() => setCarouselIndex(1)}>2</div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Design & Arrange</h3>
                                    <p style={{ color: '#636366', lineHeight: '1.5' }}>
                                        Drag, drop, and align. Use AI layouts to find the perfect fit for your collection.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    background: carouselIndex === 2 ? '#005bb7' : '#f2f2f7',
                                    color: carouselIndex === 2 ? 'white' : '#1c1c1e',
                                    width: '40px', height: '40px',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '18px', flexShrink: 0,
                                    cursor: 'pointer', transition: 'all 0.3s ease'
                                }} onClick={() => setCarouselIndex(2)}>3</div>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Hang with Confidence</h3>
                                    <p style={{ color: '#636366', lineHeight: '1.5' }}>
                                        Export a PDF guide with exact coordinates for every nail. No more Swiss-cheese walls.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className={`${styles.featureImageWrapper} ${styles.hangingGuide}`} style={{ flex: 2 }}>
                            <LandingCarousel currentIndex={carouselIndex} onChange={setCarouselIndex} />
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
                            <AutoplayVideo
                                src={SMART_LAYOUT_VIDEO}
                                className={styles.featureImage}
                                preload="metadata"
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
                            <AutoplayVideo
                                src={ADD_PHOTOS_VIDEO}
                                className={styles.featureImage}
                                preload="metadata"
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

                {/* Featured Resources */}
                <FeaturedResources id="resources" />

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
