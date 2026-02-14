import React, { useState, useEffect } from 'react';
import styles from './HelpPage.module.css';
import {
    Grid3x3,
    Image,
    MousePointer2,
    Keyboard,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Smartphone,
    HelpCircle
} from 'lucide-react';
import WebsiteHeader from '../Layout/WebsiteHeader';
import WebsiteFooter from '../Layout/WebsiteFooter';
import BackToTop from '../Common/BackToTop';
import { useBugReporter } from '../../hooks/useBugReporter';

const HelpPage: React.FC = () => {
    React.useEffect(() => {
        const title = "Help Center & Resources | GalleryPlanner™";
        const description = "Everything you need to know about creating your perfect gallery wall. Learn how to manage inventory, arrange layouts, and export for installation.";

        document.title = title;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "Is GalleryPlanner really free?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! While in Early Beta, all features (including Pro exports and AI tools) are completely free to use as we refine the experience."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Where are my photos stored?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Locally in your browser. We never upload your images to a server, ensuring your personal photos remain 100% private and secure on your own device."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Can I use this on my phone or tablet?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Absolutely. GalleryPlanner is a responsive web app designed to work perfectly across desktops, tablets, and mobile phones for planning on the go."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How do I print my layout?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Use the 'Export' tool to generate a print-ready PDF hanging guide with precise measurements and a high-resolution ZIP of your cropped photos."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Do I need to create an account?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "No. We believe in a friction-free experience. Your projects are saved automatically to your device's local storage without needing a login."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What if I switch computers or browsers?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "You can use the 'Export Project (.gwall)' feature to save your data to a file, then simply 'Import' it on any other device or browser."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Does it support non-rectangular frames?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. You can change any frame's shape to Round or Oval through the Frame Properties panel to match your unique decor."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Can I plan for multiple walls at once?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Currently, each project represents one wall. However, you can create as many separate projects as you like for different rooms in your home."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What exactly is 'Smart Fill'?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Smart Fill is our AI-powered engine that analyzes your photo library for composition, color, and resolution to find the perfect spot for every photo automatically."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How do I measure for a staircase wall?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Go to Wall Settings and toggle 'Staircase'. You can then set the Rise percentage to match the exact slope of your stairs for a perfect fit."
                    }
                }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemaData);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const { reportBug } = useBugReporter();
    const [activeSection, setActiveSection] = useState<string>('');
    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
        const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
        const ua = navigator.userAgent;
        const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K', 'Mac'];
        const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

        setIsMac(
            macosPlatforms.indexOf(platform) !== -1 ||
            iosPlatforms.indexOf(platform) !== -1 ||
            (ua.indexOf('Mac') !== -1 && !!(navigator as any).maxTouchPoints) || // iPad Pro "Desktop" mode
            /Mac|iPhone|iPod|iPad/.test(ua)
        );
    }, []);

    const modSymbol = isMac ? '⌘' : 'Ctrl';

    const sections = [
        { id: 'inventory', title: 'Inventory' },
        { id: 'photos', title: 'Photos' },
        { id: 'workspace', title: 'Workspace' },
        { id: 'layout', title: 'Layout Engine' },
        { id: 'mobile', title: 'Mobile' },
        { id: 'shortcuts', title: 'Shortcuts' },
        { id: 'faq', title: 'FAQ' },
    ];

    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = sections.map((s) => document.getElementById(s.id));
            const currentSection = sectionElements.reverse().find((el) => {
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                return rect.top <= 120;
            });
            if (currentSection) {
                setActiveSection(currentSection.id);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    return (
        <div className={styles.container}>
            <WebsiteHeader />

            {/* Main Content */}
            <main className={styles.content}>
                <div className={styles.hero}>
                    <h1>Help & Resources</h1>
                    <p className={styles.intro}>
                        Everything you need to know about creating your perfect gallery wall.
                        Learn how to manage inventory, arrange layouts, and export for installation.
                    </p>
                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <button
                            className={styles.actionBtn}
                            onClick={reportBug}
                        >
                            <span role="img" aria-label="bug">🐞</span> Report an Issue
                        </button>
                        <a
                            href="mailto:hello@gallery-planner.com"
                            className={styles.actionBtn}
                        >
                            <span role="img" aria-label="email">✉️</span> Contact Us
                        </a>
                    </div>
                </div>

                <div className={styles.alert}>
                    <strong>BETA NOTICE:</strong> &nbsp; GalleryPlanner is currently in Early Beta. All PRO features are completely free to use while we refine the application.
                </div>

                <div className={styles.layout}>
                    {/* Sticky Sidebar Navigation */}
                    <aside className={styles.sidebar}>
                        <h3>On This Page</h3>
                        <nav>
                            <ul>
                                {sections.map((section) => (
                                    <li key={section.id} className={activeSection === section.id ? styles.activeNav : ''}>
                                        <a href={`#${section.id}`}>{section.title}</a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    <div className={styles.mainContent}>
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

                            {/* Mobile Experience */}
                            <section id="mobile" className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.iconWrapper}>
                                        <Smartphone size={24} />
                                    </div>
                                    <h2>Mobile Experience</h2>
                                </div>
                                <div className={styles.cardContent}>
                                    <p>The mobile web app is optimized for planning on the go. While it features a streamlined set of tools compared to the desktop version, it remains fully capable.</p>
                                    <ul className={styles.featureList}>
                                        <li className={styles.featureItem}>
                                            <CheckCircle2 size={18} className={styles.checkIcon} />
                                            <div className={styles.featureText}>
                                                <strong>Touch-Optimized Gestures</strong>
                                                <span>Pinch to zoom, drag to pan, and tap to select. Long-press any frame to access the context menu (Lock, Delete, Layer).</span>
                                            </div>
                                        </li>
                                        <li className={styles.featureItem}>
                                            <CheckCircle2 size={18} className={styles.checkIcon} />
                                            <div className={styles.featureText}>
                                                <strong>Focused Feature Set</strong>
                                                <span>Includes all essential planning tools: Smart Layouts, Wall Setup, and Photo Management. Shortcuts and advanced bulk selection are desktop-exclusive.</span>
                                            </div>
                                        </li>
                                        <li className={styles.featureItem}>
                                            <CheckCircle2 size={18} className={styles.checkIcon} />
                                            <div className={styles.featureText}>
                                                <strong>Seamless Handoff</strong>
                                                <span>Export your project file (.gwall) from desktop and open it on mobile to view your plan in the actual room.</span>
                                            </div>
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
                                    <h2>Shortcuts Reference <span className={styles.desktopBadge}>Desktop Only</span></h2>
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
                                                    <td><kbd>{modSymbol}</kbd> + Scroll</td>
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
                                                    <td><kbd>{modSymbol}</kbd> + <kbd>A</kbd></td>
                                                    <td>Select All</td>
                                                </tr>
                                                <tr>
                                                    <td></td>
                                                    <td>Click + Drag</td>
                                                    <td>Marquee selection</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Edit</strong></td>
                                                    <td><kbd>{modSymbol}</kbd> + <kbd>D</kbd></td>
                                                    <td>Duplicate Selection</td>
                                                </tr>
                                                <tr>
                                                    <td></td>
                                                    <td><kbd>{modSymbol}</kbd> + Drag</td>
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

                        {/* FAQ Section */}
                        <section id="faq" className={styles.faqSection}>
                            <div className={styles.faqHeader}>
                                <h2>Frequently Asked Questions</h2>
                                <p>Quick answers to common questions about GalleryPlanner.</p>
                            </div>
                            <div className={styles.faqGrid}>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> Is GalleryPlanner really free?</h3>
                                    <p>Yes! While in Early Beta, all features (including Pro exports and AI tools) are completely free to use as we refine the experience.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> Where are my photos stored?</h3>
                                    <p>Locally in your browser. We never upload your images to a server, ensuring your personal photos remain 100% private and secure on your own device.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> Can I use this on my phone or tablet?</h3>
                                    <p>Absolutely. GalleryPlanner is a responsive web app designed to work perfectly across desktops, tablets, and mobile phones for planning on the go.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> How do I print my layout?</h3>
                                    <p>Use the 'Export' tool to generate a print-ready PDF hanging guide with precise measurements and a high-resolution ZIP of your cropped photos.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> Do I need to create an account?</h3>
                                    <p>No. We believe in a friction-free experience. Your projects are saved automatically to your device's local storage without needing a login.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> What if I switch computers or browsers?</h3>
                                    <p>You can use the 'Export Project (.gwall)' feature to save your data to a file, then simply 'Import' it on any other device or browser.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> Does it support non-rectangular frames?</h3>
                                    <p>Yes. You can change any frame's shape to Round or Oval through the Frame Properties panel to match your unique decor.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> Can I plan for multiple walls at once?</h3>
                                    <p>Currently, each project represents one wall. However, you can create as many separate projects as you like for different rooms in your home.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> What exactly is 'Smart Fill'?</h3>
                                    <p>Smart Fill is our AI-powered engine that analyzes your photo library for composition, color, and resolution to find the perfect spot for every photo automatically.</p>
                                </div>
                                <div className={styles.faqItem}>
                                    <h3><HelpCircle size={20} className={styles.faqQuestionIcon} /> How do I measure for a staircase wall?</h3>
                                    <p>Go to Wall Settings and toggle 'Staircase'. You can then set the Rise percentage to match the exact slope of your stairs for a perfect fit.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <WebsiteFooter />
            <BackToTop />
        </div>
    );
};

export default HelpPage;
