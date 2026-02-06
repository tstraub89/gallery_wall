import React from 'react';
import styles from './LandingPage.module.css'; // Reuse landing page styles for consistency
import WebsiteHeader from '../Layout/WebsiteHeader';
import WebsiteFooter from '../Layout/WebsiteFooter';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className={styles.container}>
            <WebsiteHeader />

            <main className={styles.hero} style={{ textAlign: 'left', maxWidth: '800px', minHeight: '60vh' }}>
                <h1 style={{ fontSize: '42px' }}>Privacy Policy</h1>
                <p style={{ fontSize: '16px', marginBottom: '40px' }}>Last Updated: February 5, 2026</p>
                <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '24px' }}>
                    This Privacy Policy explains how GalleryPlanner (“GalleryPlanner”, “we”, “us”, or “our”) handles information when you use our website and gallery wall planning tools (the “Service”). By using the Service, you agree to this Policy.
                </p>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>1. Local-first design and your projects</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        GalleryPlanner is designed with a local-first philosophy. Your gallery wall projects, including measurements, layouts, and any photos you add, are stored directly in your browser’s local storage (such as IndexedDB and localStorage) and are not uploaded to our servers.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        We do not operate user accounts for the core app and do not maintain server-side backups of your projects or photos. If you clear your browser data, switch browsers, or uninstall your browser, your projects may be permanently deleted and cannot be recovered by us.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>2. AI features and your photos</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        GalleryPlanner may offer AI-assisted layout or design features that run in your browser. Your photos and layouts used with these features are processed locally on your device and are not sent to third-party AI providers.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        We do not use your photos or layouts to train machine learning models outside of your device. If we ever introduce server-side or third-party AI processing, we will update this Policy and clearly explain what is sent, to whom, and why before you use those features.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>3. Analytics and technical data</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        We use privacy-focused analytics tools to understand how the Service is used and to improve performance and reliability. These tools collect anonymized or aggregated technical information and do not use cookies to track you across sites.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        We currently use:
                    </p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', lineHeight: '1.6', color: '#48484a' }}>
                        <li style={{ marginBottom: '16px' }}>
                            <strong>Cloudflare Web Analytics:</strong> Cloudflare’s lightweight script (beacon.min.js) measures page views, performance (including Core Web Vitals), and general information such as browser type, operating system, device type (mobile vs. desktop), and country derived from IP address. We also use URL hash-based “virtual page views” (for example, #event=clicked_button) to track specific in-app actions as custom events. Cloudflare does not store IP addresses or use them to track individual users over time; fingerprinting identifiers are rotated or anonymized.
                        </li>
                        <li style={{ marginBottom: '16px' }}>
                            <strong>Vercel Analytics:</strong> Vercel Analytics records anonymized visitor counts, referrers (such as search engines or social platforms), pages viewed, and custom events that we explicitly track (for example, “Export PDF” or “Launch App” via va.track). It is cookie-free by default and generates a random visitor identifier that resets daily, so it cannot be used to trace a specific session back to a specific person.
                        </li>
                        <li style={{ marginBottom: '16px' }}>
                            <strong>Vercel Speed Insights:</strong> Vercel Speed Insights collects technical performance metrics, such as how long it takes to render content (for example, Largest Contentful Paint) and layout shifts (CLS). This telemetry is focused on performance and does not include user behavior or identifying information.
                        </li>
                    </ul>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        We do not intentionally collect information that directly identifies you (such as your name or email address) through these analytics tools. However, our hosting and analytics providers may process IP addresses and related technical data as part of providing their services.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>4. Cookies and local storage</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        GalleryPlanner uses your browser’s local storage (including IndexedDB and localStorage) to save your projects and preferences so that your work is available between visits without creating an account. This storage is essential for the core functionality of the Service.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        We do not use third-party advertising or tracking cookies on the Service. You can control or clear stored data through your browser settings; doing so may remove your saved projects and preferences.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>5. Data sharing and service providers</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        We do not sell your personal data. We do not share your projects or photos with advertisers or data brokers.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        We may share limited technical information with our service providers—such as hosting, performance, and analytics providers (including Vercel and Cloudflare)—solely to operate, secure, and improve the Service. These providers process data on our behalf and are not permitted to use it for their own marketing or advertising purposes.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>6. Communications and contact</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        We only receive information that directly identifies you (such as your name or email address) if you choose to contact us, for example by sending us an email or opening an issue on our GitHub repository. We use this information solely to respond to your inquiry, provide support, and maintain our correspondence.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        If you contact us and later want your messages deleted, you can request this at any time using the email listed below.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>7. International users</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        The Service is operated from the United States, specifically the Commonwealth of Massachusetts. If you access the Service from outside the United States (including Canada, the European Union, or the United Kingdom), your information may be processed in the United States or other locations where our service providers operate.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        We aim to handle your information in a way that is consistent with applicable data protection laws, following principles of lawfulness, fairness, and transparency. If you are in a jurisdiction that grants you specific privacy rights (such as access, correction, or deletion), you may contact us to exercise those rights where they apply.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>8. Children’s privacy</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        GalleryPlanner is not directed to children under 13, and we do not knowingly collect personal information from children. If you believe that a child has provided us with personal information, please contact us so we can take appropriate steps.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>9. Changes to this Policy</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginBottom: '16px' }}>
                        We may update this Privacy Policy from time to time. When we do, we will revise the “Last updated” date at the top of this page and, where appropriate, provide additional notice within the Service.
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        Your continued use of the Service after any changes take effect constitutes your acceptance of the updated Policy.
                    </p>
                </section>

                <section style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>10. Contact</h2>
                    <p style={{ lineHeight: '1.6', color: '#48484a' }}>
                        If you have any questions about this Privacy Policy or how we handle information, you can contact us at:
                    </p>
                    <p style={{ lineHeight: '1.6', color: '#48484a', marginTop: '16px' }}>
                        <strong>Email:</strong> <a href="mailto:hello@gallery-planner.com" style={{ color: '#007aff' }}>hello@gallery-planner.com</a><br />
                        <strong>GitHub:</strong> <a href="https://github.com/tstraub89/gallery_wall" style={{ color: '#007aff' }}>https://github.com/tstraub89/gallery_wall</a>
                    </p>
                </section>
            </main>

            <WebsiteFooter />
        </div>
    );
};

export default PrivacyPolicy;
