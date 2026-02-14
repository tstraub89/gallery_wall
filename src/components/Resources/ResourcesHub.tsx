import React from 'react';
import { Link } from 'react-router-dom';
import { ArticleMetadata, getArticlesByCategory, getPillarPages } from '../../content/articles/articleRegistry';
import WebsiteHeader from '../Layout/WebsiteHeader';
import WebsiteFooter from '../Layout/WebsiteFooter';
import BackToTop from '../Common/BackToTop';
import styles from './ResourcesHub.module.css';
import { Clock, BookOpen, Sparkles } from 'lucide-react';

const ResourcesHub: React.FC = () => {

    // Fetch articles by category
    const pillarArticles = getPillarPages();
    const designArticles = getArticlesByCategory('Design 101').filter(a => !a.pillar);
    const installationArticles = getArticlesByCategory('Installation').filter(a => !a.pillar);
    const appArticles = getArticlesByCategory('App Guides').filter(a => !a.pillar);

    // SEO: Set document title
    React.useEffect(() => {
        document.title = 'Resources & Guides | GalleryPlanner™';

        const metaDescription = document.querySelector('meta[name="description"]');
        const description = 'Learn how to design, plan, and install stunning gallery walls with our comprehensive guides and tutorials.';

        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }
    }, []);

    return (
        <div className={styles.container}>
            <WebsiteHeader />

            <main className={styles.main}>
                {/* Hero Section */}
                <section className={styles.hero}>
                    <BookOpen size={48} className={styles.heroIcon} />
                    <h1>Learn & Design Guides</h1>
                    <p>
                        Everything you need to design, plan, and install beautiful gallery walls.
                        From beginner tutorials to advanced techniques, we've got you covered.
                    </p>
                    <Link to="/app" className={styles.ctaButton}>
                        Try GalleryPlanner Free
                    </Link>
                </section>

                {/* Pillar Guides Section */}
                {pillarArticles.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <Sparkles className={styles.sectionIcon} />
                            <div>
                                <h2>Comprehensive Guides</h2>
                                <p>Deep dives into everything you need to know about gallery walls and GalleryPlanner.</p>
                            </div>
                        </div>

                        <div className={styles.pillarGrid}>
                            {pillarArticles.map((article) => (
                                <ArticleCard key={article.id} article={article} featured />
                            ))}
                        </div>
                    </section>
                )}

                {/* Design 101 Section */}
                {designArticles.length > 0 && (
                    <section className={styles.section}>
                        <h2>Design 101</h2>
                        <div className={styles.clusterGrid}>
                            {designArticles.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Installation Section */}
                {installationArticles.length > 0 && (
                    <section className={styles.section}>
                        <h2>Installation Guides</h2>
                        <div className={styles.clusterGrid}>
                            {installationArticles.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </section>
                )}

                {/* App Guides Section */}
                {appArticles.length > 0 && (
                    <section className={styles.section}>
                        <h2>App Guides</h2>
                        <div className={styles.clusterGrid}>
                            {appArticles.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Bottom CTA */}
                <section className={styles.bottomCta}>
                    <h2>Ready to Design Your Gallery Wall?</h2>
                    <p>Put these guides into action with GalleryPlanner's free planning tools.</p>
                    <Link to="/app" className={styles.ctaButton}>
                        Launch GalleryPlanner
                    </Link>
                </section>
            </main>

            <WebsiteFooter />
            <BackToTop />
        </div>
    );
};

// Article Card Component
interface ArticleCardProps {
    article: ArticleMetadata;
    featured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false }) => {
    return (
        <Link
            to={`/learn/${article.slug}`}
            className={`${styles.articleCard} ${featured ? styles.featured : ''}`}
        >
            {/* Hero Image */}
            {article.heroImage && (
                <div className={styles.cardImageContainer}>
                    <img
                        src={article.heroImage}
                        alt={article.title}
                        className={styles.cardImage}
                        loading="lazy"
                    />
                </div>
            )}

            <div className={styles.cardContent}>
                {featured && (
                    <div className={styles.featuredBadge}>
                        <Sparkles size={14} />
                        Comprehensive Guide
                    </div>
                )}
                <div className={styles.cardHeader}>
                    <span className={styles.categoryBadge}>{article.category}</span>
                    {article.videoPlaceholder && (
                        <span className={styles.videoIcon} title="Video coming soon">
                            🎥
                        </span>
                    )}
                </div>
                <h3>{article.title}</h3>
                <p className={styles.cardDescription}>{article.description}</p>
                <div className={styles.cardFooter}>
                    <span className={styles.readingTime}>
                        <Clock size={14} /> {article.readingTime} min read
                    </span>
                    <span className={styles.readMore}>Read →</span>
                </div>
            </div>
        </Link>
    );
};

export default ResourcesHub;
