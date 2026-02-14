import React from 'react';
import styles from './LandingPage.module.css';
import { Github, Linkedin, Microscope, Ruler, Lock } from 'lucide-react';
import WebsiteHeader from '../Layout/WebsiteHeader';
import WebsiteFooter from '../Layout/WebsiteFooter';

const AboutPage: React.FC = () => {
    React.useEffect(() => {
        const title = "About the Founder | GalleryPlanner";
        const description = "Meet Timothy Straub, the scientist and hobbyist who built GalleryPlanner with a privacy-first, local-only philosophy.";

        document.title = title;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "mainEntity": {
                "@type": "Person",
                "name": "Timothy Straub",
                "jobTitle": "Data Scientist",
                "worksFor": {
                    "@type": "Organization",
                    "name": "Tiny Health"
                },
                "url": "https://gallery-planner.com/about",
                "sameAs": [
                    "https://github.com/tstraub89/",
                    "https://www.linkedin.com/in/tjstraub/"
                ]
            },
            "description": description
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemaData);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

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
                        Built for precision, driven by data.
                    </h1>
                </div>

                <div className={styles.card} style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Microscope size={28} className={styles.checkIcon} />
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>The Scientist Behind The Code</h2>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', flexDirection: 'row-reverse' }}>
                        <img
                            src="/tim-straub.webp"
                            alt="Timothy Straub"
                            width="120"
                            height="120"
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '4px solid #f2f2f7',
                                flexShrink: 0
                            }}
                        />
                        <p style={{ lineHeight: '1.7', color: '#48484a', fontSize: '17px', flex: '1 1 300px', margin: 0 }}>
                            Hi, I'm Timothy Straub. By day, I'm a data scientist at <strong>Tiny Health</strong>, working on computational biology
                            and machine learning to decode the human microbiome. I've spent over a decade in the scientific space,
                            where precision and data integrity are everything.
                        </p>
                    </div>
                </div>

                <div className={styles.card} style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Ruler size={28} className={styles.checkIcon} />
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>The Spark</h2>
                    </div>
                    <p style={{ lineHeight: '1.7', color: '#48484a', fontSize: '17px', marginBottom: '16px' }}>
                        My wife had spent years collecting a beautiful assortment of frames. When we finally had enough to fill a wall,
                        the task fell to me to arrange them. I tried the old "lay them on the floor" method, but translating that
                        mess to a vertical wall—with specific spacing and measurements—was a nightmare.
                    </p>
                    <p style={{ lineHeight: '1.7', color: '#48484a', fontSize: '17px' }}>
                        I needed a tool that respected <strong>exact dimensions</strong>. "About 8 inches" wasn't good enough;
                        I needed to know <em>exactly</em> where to put the nail.
                    </p>
                </div>

                <div className={styles.card} style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Lock size={28} className={styles.checkIcon} />
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>The Philosophy: Privacy First</h2>
                    </div>
                    <p style={{ lineHeight: '1.7', color: '#48484a', fontSize: '17px', marginBottom: '16px' }}>
                        As I looked for existing apps, one problem stood out: most wanted me to upload photos of my kids to their
                        cloud servers. As a father and a data scientist, that didn't sit right with me.
                    </p>
                    <p style={{ lineHeight: '1.7', color: '#48484a', fontSize: '17px' }}>
                        I built GalleryPlanner to be <strong>Local-First</strong>. Your photos never leave your device.
                        They live in your browser's storage, safe and private. It’s the tool I wanted for my own home,
                        shared with you.
                    </p>
                </div>

                <div className={styles.card} style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '24px' }}>🤖</span>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>How We Build: Transparent & Modern</h2>
                    </div>
                    <p style={{ lineHeight: '1.7', color: '#48484a', fontSize: '17px', marginBottom: '16px' }}>
                        We believe in using the best tools available to build faster and better. GalleryPlanner is proudly
                        <strong> "Vibe Coded"</strong>—meaning we use advanced AI coding assistants to write code, generate visuals,
                        and iterate on features at lightning speed.
                    </p>
                    <p style={{ lineHeight: '1.7', color: '#48484a', fontSize: '17px' }}>
                        While AI helps us build, the <strong>vision, logic, and design</strong> are 100% human. We review every line of code
                        and every sentence of content to ensure it meets our standards for precision and quality.
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '60px' }}>
                    <a href="https://github.com/tstraub89/" target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#636366', textDecoration: 'none', fontWeight: '500' }}>
                        <Github size={20} /> GitHub
                    </a>
                    <a href="https://www.linkedin.com/in/tjstraub/" target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0077b5', textDecoration: 'none', fontWeight: '500' }}>
                        <Linkedin size={20} /> LinkedIn
                    </a>
                    <a href="https://bsky.app/profile/timothystraub.com" target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1185fe', textDecoration: 'none', fontWeight: '500' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>🦋</span> Bluesky
                    </a>
                </div>
            </main>

            <WebsiteFooter />
        </div>
    );
};

export default AboutPage;
