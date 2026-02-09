import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../Landing/LandingPage.module.css';
import Logo from '../Header/Logo';
import { Github, Instagram, Pin, Rss } from 'lucide-react';

const WebsiteFooter: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Logo hideStatus />
                    </Link>
                    <div className={styles.copyright}>
                        © 2026 Timothy Straub.<br />
                        Built with precision for beautiful homes.<br />
                        <span style={{ color: '#6e6e73', fontSize: '0.9em' }}>Proudly built with AI assistance.</span>
                    </div>
                </div>


                <div className={styles.footerLinks}>
                    <div className={styles.footerColumn}>
                        <strong className={styles.footerColumnTitle}>Product</strong>
                        <Link to="/app" className={styles.footerLink}>Launch App</Link>
                        {/* Use absolute path or check if on home for anchor links */}
                        <a href="/#features" className={styles.footerLink}>Features</a>
                        <a href="/#pro" className={styles.footerLink}>Pricing</a>
                    </div>

                    <div className={styles.footerColumn}>
                        <span className={styles.footerColumnTitle}>Resources</span>
                        <Link to="/learn" className={styles.footerLink}>Design Guides</Link>
                        <Link to="/help" className={styles.footerLink}>Help Center</Link>
                        <Link
                            to="/changelog"
                            className={styles.footerLink}
                        >
                            What's New
                        </Link>
                    </div>

                    <div className={styles.footerColumn}>
                        <span className={styles.footerColumnTitle}>Company</span>
                        <Link to="/about" className={styles.footerLink}>About</Link>
                        <Link to="/privacy" className={styles.footerLink}>Privacy</Link>
                        <a href="mailto:hello@gallery-planner.com" className={styles.footerLink}>Contact</a>
                    </div>

                    <div className={styles.footerColumn}>
                        <strong className={styles.footerColumnTitle}>Connect</strong>
                        <a href="https://github.com/tstraub89/gallery_wall" target="_blank" rel="noreferrer" className={styles.footerLink}>
                            <Github size={16} /> GitHub
                        </a>
                        <a href="https://www.instagram.com/gallery.planner/" target="_blank" rel="noreferrer" className={styles.footerLink}>
                            <Instagram size={16} /> Instagram
                        </a>
                        <a href="https://bsky.app/profile/gallery-planner.com" target="_blank" rel="noreferrer" className={styles.footerLink}>
                            <span style={{ fontSize: '14px', lineHeight: 1 }}>🦋</span> Bluesky
                        </a>
                        <a href="https://www.pinterest.com/galleryplanner/" target="_blank" rel="noreferrer" className={styles.footerLink}>
                            <Pin size={16} /> Pinterest
                        </a>
                        <a href="/rss.xml" target="_blank" rel="noreferrer" className={styles.footerLink}>
                            <Rss size={16} /> RSS Feed
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default WebsiteFooter;
