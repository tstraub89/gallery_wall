import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './LandingPage.module.css';
import WebsiteHeader from '../Layout/WebsiteHeader';
import WebsiteFooter from '../Layout/WebsiteFooter';
// @ts-ignore
import changelog from '../../../CHANGELOG.md?raw';

const ChangelogPage: React.FC = () => {
    return (
        <div className={styles.container}>
            <WebsiteHeader />

            <main style={{ maxWidth: '800px', margin: '0 auto', padding: '140px 20px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '800',
                        marginBottom: '16px',
                        background: 'linear-gradient(135deg, #1c1c1e 0%, #48484a 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}>
                        What's New
                    </h1>
                    <p style={{ fontSize: '18px', color: '#8e8e93' }}>
                        The latest updates and improvements to GalleryPlanner.
                    </p>
                </div>

                <div className={styles.card} style={{
                    padding: '40px',
                    lineHeight: '1.6',
                    color: '#48484a'
                }}>
                    <div className="changelog-content">
                        <ReactMarkdown
                            components={{
                                h1: ({ node, ...props }) => <h1 style={{ fontSize: '32px', marginBottom: '16px' }} {...props} />,
                                h2: ({ node, ...props }) => <h2 style={{ fontSize: '24px', marginTop: '32px', marginBottom: '16px', color: '#1c1c1e' }} {...props} />,
                                h3: ({ node, ...props }) => <h3 style={{ fontSize: '18px', marginTop: '24px', marginBottom: '8px', color: '#1c1c1e' }} {...props} />,
                                ul: ({ node, ...props }) => <ul style={{ paddingLeft: '20px', marginBottom: '16px' }} {...props} />,
                                li: ({ node, ...props }) => <li style={{ marginBottom: '8px' }} {...props} />,
                                strong: ({ node, ...props }) => <strong style={{ color: '#1c1c1e' }} {...props} />,
                                a: ({ node, ...props }) => <a style={{ color: '#0071e3', textDecoration: 'none' }} {...props} />
                            }}
                        >
                            {changelog}
                        </ReactMarkdown>
                    </div>
                </div>
            </main>

            <WebsiteFooter />
        </div>
    );
};

export default ChangelogPage;
