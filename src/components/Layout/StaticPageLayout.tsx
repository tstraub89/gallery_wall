import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import WebsiteHeader from './WebsiteHeader';
import WebsiteFooter from './WebsiteFooter';
import BackToTop from '../Common/BackToTop';
import styles from './StaticPageLayout.module.css';
import { useStaticData } from '../../context/StaticDataContext.tsx';
import { getTextContent } from '../../utils/stringUtils';

interface StaticPageLayoutProps {
    slug: string;
    title?: string;
    description?: string;
}

const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ slug, title: defaultTitle, description: defaultDescription }) => {
    const staticData = useStaticData();
    const [content, setContent] = useState<string>(staticData.content || '');
    const [loading, setLoading] = useState(!staticData.content);

    useEffect(() => {
        if (staticData.content) {
            setContent(staticData.content);
            setLoading(false);
            return;
        }

        // Load markdown content dynamically if not provided via staticData (dev mode)
        const loadContent = async () => {
            try {
                let markdown = '';
                if (slug === 'changelog') {
                    const module = await import('../../../CHANGELOG.md?raw');
                    markdown = module.default;
                } else {
                    const module = await import(`../../content/pages/${slug}.md?raw`);
                    markdown = module.default;
                }
                setContent(markdown);
            } catch (err) {
                console.error(`Failed to load content for ${slug}:`, err);
                setContent('# Content Not Found\nSorry, the requested page could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [slug, staticData.content]);

    // SEO
    useEffect(() => {
        if (content) {
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const pageTitle = titleMatch ? titleMatch[1] : (defaultTitle || slug);
            document.title = `${pageTitle} | GalleryPlanner™`;

            if (defaultDescription) {
                const metaDescription = document.querySelector('meta[name="description"]');
                if (metaDescription) {
                    metaDescription.setAttribute('content', defaultDescription);
                }
            }
        }
    }, [content, slug, defaultTitle, defaultDescription]);

    const components: any = {
        h2: ({ children }: any) => <h2>{children}</h2>,
        h3: ({ children }: any) => <h3>{children}</h3>,
        p: ({ children }: any) => {
            // Check if it's just a profile image
            if (React.Children.count(children) === 1) {
                const child = React.Children.toArray(children)[0];
                if (React.isValidElement(child) && (child.type === 'img' || (child as any).props?.node?.tagName === 'img')) {
                    const props = (child as any).props;
                    if (props?.alt === 'Timothy Straub') {
                        return <img src={props.src} alt={props.alt} className={styles.profileImage} />;
                    }
                }
            }
            return <p>{children}</p>;
        },
        a: ({ href, children, ...props }: any) => {
            const text = getTextContent(children);
            const isButton = href?.startsWith('btn:');

            if (isButton) {
                const type = href.split(':')[1];
                return (
                    <a
                        href="#"
                        className={`${styles.button} ${type === 'report' || props.className?.includes('primary') ? styles.primaryButton : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            if (type === 'report') {
                                // Trigger bug reporter if possible, or just scroll to footer
                                window.dispatchEvent(new CustomEvent('open-bug-reporter'));
                            } else if (type === 'contact') {
                                window.location.href = 'mailto:hello@gallery-planner.com';
                            }
                        }}
                    >
                        {text}
                    </a>
                );
            }

            return <a href={href} {...props}>{children}</a>;
        },
        blockquote: ({ children }: any) => (
            <div className={styles.betaNotice}>
                {children}
            </div>
        ),
        table: ({ children }: any) => (
            <div className={styles.tableWrapper}>
                <table className={styles.table}>{children}</table>
            </div>
        ),
        hr: () => (
            <div className={styles.socialLinks}>
                {/* This will be populated by the social links detected in 'a' tags */}
            </div>
        )
    };

    if (loading) return null;

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const pageTitle = defaultTitle || (titleMatch ? titleMatch[1] : (defaultTitle || slug));

    // Filter out the H1 from the rendered markdown as we render it in the header
    const cleanContent = content.replace(/^#\s+.+(\r?\n|$)/, '');

    return (
        <div className={styles.container}>
            <WebsiteHeader />
            <main className={styles.main}>
                <div className={styles.pageHeader}>
                    <h1>{pageTitle}</h1>
                    {defaultDescription && <p>{defaultDescription}</p>}
                </div>
                <div className={styles.content}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={components}
                    >
                        {cleanContent}
                    </ReactMarkdown>
                </div>
            </main>
            <WebsiteFooter />
            <BackToTop />
        </div>
    );
};

export default StaticPageLayout;
