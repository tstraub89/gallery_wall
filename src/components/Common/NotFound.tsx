import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../Landing/LandingPage.module.css'; // Reuse styling
import { Home, ArrowRight } from 'lucide-react';
import WebsiteHeader from '../Layout/WebsiteHeader';
import WebsiteFooter from '../Layout/WebsiteFooter';

const NotFound: React.FC = () => {
    return (
        <div className={styles.container} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <WebsiteHeader />

            <main className={styles.hero} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <h1 style={{ fontSize: '120px', marginBottom: '0', background: 'linear-gradient(135deg, #ddd 0%, #aaa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
                <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#1c1c1e' }}>Page Not Found</h2>
                <p style={{ fontSize: '18px', color: '#636366', maxWidth: '400px', marginBottom: '40px' }}>
                    We couldn't find the wall you're looking for. It might have been moved or demolished.
                </p>

                <div className={styles.heroActions}>
                    {/* Fixed contrast issue by not using ctaBtn which forces white text */}
                    <Link to="/" style={{
                        background: '#f2f2f7',
                        color: '#1c1c1e',
                        padding: '10px 24px',
                        borderRadius: '99px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Home size={18} /> Go Home
                    </Link>
                    <Link to="/app" className={styles.ctaBtn}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Start Designing <ArrowRight size={18} />
                        </span>
                    </Link>
                </div>
            </main>

            <WebsiteFooter />
        </div>
    );
};

export default NotFound;
