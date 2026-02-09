import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ArticleMetadata, getArticleBySlug, getRelatedArticles } from '../../content/articles/articleRegistry';
import { slugify, stripMarkdown, getTextContent } from '../../utils/stringUtils';
import WebsiteHeader from '../Layout/WebsiteHeader';
import WebsiteFooter from '../Layout/WebsiteFooter';
import BackToTop from '../Common/BackToTop';
import styles from './ArticleLayout.module.css';
import { Share2, Clock, Calendar, ArrowLeft } from 'lucide-react';

const ArticleLayout: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<ArticleMetadata | null>(() =>
        slug ? getArticleBySlug(slug) || null : null
    );
    const [content, setContent] = useState<string>('');
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [activeSection, setActiveSection] = useState<string>('');

    useEffect(() => {
        if (!slug) return;

        // Get article metadata
        const metadata = getArticleBySlug(slug);
        if (!metadata) return;

        setArticle(metadata);

        // Load markdown content
        import(`../../content/articles/${metadata.id}.md?raw`)
            .then((module) => {
                const markdownContent = module.default;
                setContent(markdownContent);

                // Note: slugify and stripMarkdown are imported from stringUtils

                let cleanedContent = markdownContent;

                // Remove Title (# ) from markdown content if present
                // (Since we render it in the header)
                cleanedContent = cleanedContent.replace(/^#\s+.+(\r?\n|$)/, '');

                setContent(cleanedContent);

                // Extract headings for TOC with slug-based IDs
                const headingRegex = /^(#{2,3})\s+(.+)$/gm;
                const matches = [...cleanedContent.matchAll(headingRegex)];
                const extractedHeadings = matches.map((match) => ({
                    id: slugify(stripMarkdown(match[2])),
                    text: stripMarkdown(match[2]),
                    level: match[1].length,
                }));
                setHeadings(extractedHeadings);
            })
            .catch(() => {
                setContent('Article content not found.');
            });
    }, [slug]);

    // Update active section on scroll
    useEffect(() => {
        const handleScroll = () => {
            const headingElements = headings.map((h) => document.getElementById(h.id));
            const currentHeading = headingElements.reverse().find((el) => {
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                return rect.top <= 100;
            });
            if (currentHeading) {
                setActiveSection(currentHeading.id);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [headings]);

    // SEO: Update document title, meta tags, and JSON-LD Schema
    useEffect(() => {
        if (article) {
            // 1. Update Title
            document.title = `${article.title} | GalleryPlanner Resources`;

            // 2. Update Meta Description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', article.description);
            } else {
                const meta = document.createElement('meta');
                meta.name = 'description';
                meta.content = article.description;
                document.head.appendChild(meta);
            }

            // 3. Inject JSON-LD Schema
            const schemaData = {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": article.title,
                "description": article.description,
                "image": article.heroImage ? [window.location.origin + article.heroImage] : [],
                "datePublished": article.publishedDate,
                "dateModified": article.lastUpdated,
                "author": [{
                    "@type": "Person",
                    "name": article.author,
                    "url": "https://gallery-planner.com"
                }],
                "publisher": {
                    "@type": "Organization",
                    "name": "GalleryPlanner",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://gallery-planner.com/logo.png"
                    }
                }
            };

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify(schemaData);
            document.head.appendChild(script);

            // Cleanup: remove schema script when unmounting or changing article
            return () => {
                document.head.removeChild(script);
            };
        }
    }, [article]);

    if (!slug || !article) {
        return <Navigate to="/learn" replace />;
    }

    const relatedArticles = getRelatedArticles(article.id);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.description,
                    url: url,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    // Custom renderer for headings to add IDs
    const components: any = {
        h2: ({ children, ...props }: any) => {
            const text = getTextContent(children);
            const id = slugify(text);
            return <h2 id={id} {...props}>{children}</h2>;
        },
        h3: ({ children, ...props }: any) => {
            const text = getTextContent(children);
            const id = slugify(text);
            return <h3 id={id} {...props}>{children}</h3>;
        },
        table: ({ children, ...props }: any) => (
            <div className={styles.tableWrapper}>
                <table {...props}>{children}</table>
            </div>
        ),
    };

    return (
        <div className={styles.container}>
            <WebsiteHeader />

            <main className={styles.main}>
                {/* Breadcrumbs */}
                <div className={styles.breadcrumbs}>
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/learn">Learn</Link>
                    <span>/</span>
                    <span>{article.title}</span>
                </div>

                <div className={styles.layout}>
                    {/* Table of Contents - Desktop Sidebar */}
                    {headings.length > 0 && (
                        <aside className={styles.toc}>
                            <div className={styles.tocSticky}>
                                <h3>On This Page</h3>
                                <ul>
                                    {headings.map((heading) => (
                                        <li
                                            key={heading.id}
                                            className={`${styles[`level${heading.level}`]} ${activeSection === heading.id ? styles.active : ''}`}
                                        >
                                            <a href={`#${heading.id}`}>{heading.text}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    )}

                    {/* Article Content */}
                    <article className={styles.article}>
                        {/* Article Header */}
                        <header className={styles.articleHeader}>
                            {article.pillar && <span className={styles.pillarBadge}>Comprehensive Guide</span>}
                            <span className={styles.categoryBadge}>{article.category}</span>
                            <h1>{article.title}</h1>
                            <p className={styles.description}>{article.description}</p>

                            <div className={styles.meta}>
                                <div className={styles.metaStats}>
                                    <div className={styles.metaItem}>
                                        <Clock size={16} />
                                        <span>{article.readingTime} min read</span>
                                    </div>
                                    {article.videoDuration && (
                                        <div className={styles.metaItem}>
                                            <span className={styles.videoIconSmall}>🎥</span>
                                            <span>{article.videoDuration}</span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <Calendar size={16} />
                                        <span>Updated {new Date(article.lastUpdated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </div>
                                <div className={styles.metaShare}>
                                    <button className={styles.shareButton} onClick={handleShare}>
                                        <Share2 size={16} />
                                        <span>Share</span>
                                    </button>
                                </div>
                            </div>

                            {/* Hero Content: Video or Image */}
                            {article.video ? (
                                <div className={styles.videoContainer}>
                                    <video
                                        controls
                                        controlsList="nodownload"
                                        onContextMenu={(e) => e.preventDefault()}
                                        className={styles.video}
                                        poster={article.heroImage}
                                    >
                                        <source src={article.video} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            ) : article.heroImage && (
                                <div className={styles.heroImage}>
                                    <img src={article.heroImage} alt={article.title} />
                                </div>
                            )}

                        </header>

                        {/* Markdown Content */}
                        <div className={styles.content}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={components}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>

                        {/* Editorial Transparency Note */}
                        <div className={styles.transparencyNote}>
                            <strong>Transparency Note:</strong> This content was drafted with the assistance of AI tools and reviewed by our human design team for accuracy. Videos were generated using NotebookLM.
                        </div>

                        {/* CTA to Try GalleryPlanner */}
                        <div className={styles.cta}>
                            <h3>Ready to Design Your Gallery Wall?</h3>
                            <p>Put these tips into practice with GalleryPlanner's free planning tools.</p>
                            <Link to="/app" className={styles.ctaButton}>Launch GalleryPlanner</Link>
                        </div>

                        {/* Related Articles */}
                        {relatedArticles.length > 0 && (
                            <div className={styles.relatedArticles}>
                                <h3>Related Resources</h3>
                                <div className={styles.relatedGrid}>
                                    {relatedArticles.map((related) => (
                                        <Link
                                            key={related.id}
                                            to={`/learn/${related.slug}`}
                                            className={styles.relatedCard}
                                        >
                                            <span className={styles.relatedCategory}>{related.category}</span>
                                            <h4>{related.title}</h4>
                                            <p>{related.description}</p>
                                            <span className={styles.readingTime}>
                                                <Clock size={14} /> {related.readingTime} min read
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>
                </div>

                {/* Back to Learn Link */}
                <div className={styles.backLink}>
                    <Link to="/learn">
                        <ArrowLeft size={16} />
                        Back to Design Guides
                    </Link>
                </div>
            </main>

            <WebsiteFooter />
            <BackToTop />
        </div>
    );
};

export default ArticleLayout;
