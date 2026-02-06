import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../Landing/LandingPage.module.css';
import Logo from '../Header/Logo';

const WebsiteFooter: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Logo hideStatus />
                    </Link>
                    <div className={styles.copyright}>
                        © 2026 Timothy Straub.<br />Built with precision for beautiful homes.
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
                        <strong className={styles.footerColumnTitle}>Resources</strong>
                        <Link to="/help" className={styles.footerLink}>Help Center</Link>
                        <Link
                            to="/changelog"
                            className={styles.footerLink}
                        >
                            What's New
                        </Link>
                        <Link to="/about" className={styles.footerLink}>About</Link>
                        <Link to="/privacy" className={styles.footerLink}>Privacy</Link>
                    </div>

                    <div className={styles.footerColumn}>
                        <strong className={styles.footerColumnTitle}>Connect</strong>
                        <a href="mailto:hello@gallery-planner.com" className={styles.footerLink}>Email Us</a>
                        <a href="https://github.com/tstraub89/gallery_wall" target="_blank" rel="noreferrer" className={styles.footerLink}>GitHub</a>
                        <a href="https://www.linkedin.com/in/tjstraub/" target="_blank" rel="noreferrer" className={styles.footerLink}>LinkedIn</a>
                        <a href="https://bsky.app/profile/timothystraub.com" target="_blank" rel="noreferrer" className={styles.footerLink}>Bluesky</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default WebsiteFooter;
