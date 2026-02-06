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
                    <div style={{ fontSize: '14px', color: '#8e8e93' }}>
                        © 2026 Timothy Straub.<br />Built with precision for beautiful homes.
                    </div>
                </div>

                <div className={styles.footerLinks} style={{ display: 'flex', gap: '32px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <strong style={{ color: '#1c1c1e', fontSize: '14px' }}>Product</strong>
                        <Link to="/app" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>Launch App</Link>
                        {/* Use absolute path or check if on home for anchor links */}
                        <a href="/#features" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>Features</a>
                        <a href="/#pro" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>Pricing</a>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <strong style={{ color: '#1c1c1e', fontSize: '14px' }}>Resources</strong>
                        <Link to="/help" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>Help Center</Link>
                        <Link to="/changelog" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>What's New</Link>
                        <Link to="/about" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>About</Link>
                        <Link to="/privacy" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>Privacy</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <strong style={{ color: '#1c1c1e', fontSize: '14px' }}>Connect</strong>
                        <a href="mailto:hello@gallery-planner.com" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>Email Us</a>
                        <a href="https://github.com/tstraub89/gallery_wall" target="_blank" rel="noreferrer" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>GitHub</a>
                        <a href="https://www.linkedin.com/in/tjstraub/" target="_blank" rel="noreferrer" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>LinkedIn</a>
                        <a href="https://bsky.app/profile/timothystraub.com" target="_blank" rel="noreferrer" style={{ color: '#636366', textDecoration: 'none', fontSize: '14px' }}>Bluesky</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default WebsiteFooter;
