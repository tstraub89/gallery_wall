import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../Landing/LandingPage.module.css';
import Logo from '../Header/Logo';
import { trackEvent, LANDING_EVENTS } from '../../utils/analytics';

const WebsiteHeader: React.FC = () => {
    return (
        <header className={styles.header}>
            <div className={styles.logoArea}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <Logo hideStatus scale={1.3} />
                </Link>
            </div>
            <nav className={styles.nav}>
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/help">Help</Link>
                <Link
                    to="/app"
                    className={styles.ctaBtn}
                    onClick={() => trackEvent(LANDING_EVENTS.NAV_LAUNCH)}
                >
                    Launch App
                </Link>
            </nav>
        </header>
    );
};

export default WebsiteHeader;
