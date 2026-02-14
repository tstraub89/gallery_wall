import React from 'react';
import { Link } from 'react-router-dom';
import styles from './FeaturedResources.module.css';
import { ArrowRight, Video } from 'lucide-react';

interface FeaturedResourcesProps {
    id?: string;
}

const FeaturedResources: React.FC<FeaturedResourcesProps> = ({ id }) => {
    return (
        <section id={id} className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.badge}>LEARN & INSPIRE</span>
                    <h2>Master the Art of Gallery Walls</h2>
                    <p>Expert guides, design tips, and video tutorials to help you create your perfect space.</p>
                </div>

                <div className={styles.grid}>
                    {/* Card 1: Standard Article */}
                    <Link to="/learn/complete-guide-to-gallery-walls" className={styles.card}>
                        <div className={styles.imageWrapper}>
                            <img
                                src="/learn/hero-gallery-walls.webp"
                                srcSet="/learn/hero-gallery-walls_mobile.webp 600w, /learn/hero-gallery-walls.webp 1493w"
                                sizes="(max-width: 768px) 100vw, 400px"
                                alt="Gallery Wall Guide"
                                className={styles.image}
                            />
                            <div className={styles.playIcon}>
                                <Video size={20} fill="currentColor" />
                            </div>
                        </div>
                        <div className={styles.content}>
                            <div className={styles.meta}>
                                <span>Design 101</span>
                                <span>•</span>
                                <span>3 min video</span>
                            </div>
                            <h3>The Complete Guide to Gallery Walls</h3>
                            <p>Everything you need to know about designing, planning, and hanging a gallery wall.</p>
                            <span className={styles.link}>Read Guide <ArrowRight size={16} /></span>
                        </div>
                    </Link>

                    {/* Card 2: App Guide */}
                    <Link to="/learn/galleryplanner-user-guide" className={styles.card}>
                        <div className={styles.imageWrapper}>
                            <img
                                src="/learn/hero-user-guide.webp"
                                alt="App User Guide"
                                className={styles.image}
                                loading="lazy"
                            />
                        </div>
                        <div className={styles.content}>
                            <div className={styles.meta}>
                                <span>App Guide</span>
                                <span>•</span>
                                <span>2 min video</span>
                            </div>
                            <h3>GalleryPlanner™: Complete User Guide</h3>
                            <p>Master our tool with this comprehensive walkthrough of features and best practices.</p>
                            <span className={styles.link}>Read Guide <ArrowRight size={16} /></span>
                        </div>
                    </Link>

                    {/* Card 3: Frame Sizes */}
                    <Link to="/learn/choosing-frame-sizes" className={styles.card}>
                        <div className={styles.imageWrapper}>
                            <img
                                src="/learn/hero-frame-sizes.webp"
                                alt="Frame Sizes Guide"
                                className={styles.image}
                                loading="lazy"
                            />
                        </div>
                        <div className={styles.content}>
                            <div className={styles.meta}>
                                <span>Design 101</span>
                                <span>•</span>
                                <span>6 min read</span>
                            </div>
                            <h3>Choosing the Right Frame Sizes</h3>
                            <p>Master the art of mixing frame sizes to create visual interest and balanced compositions.</p>
                            <span className={styles.link}>Read Article <ArrowRight size={16} /></span>
                        </div>
                    </Link>
                </div>

                <div className={styles.cta}>
                    <Link to="/learn" className={styles.viewAllBtn}>
                        Browse All Guides <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedResources;
