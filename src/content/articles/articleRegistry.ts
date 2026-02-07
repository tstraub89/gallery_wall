export interface ArticleMetadata {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: 'App Guides' | 'Design 101' | 'Installation';
    pillar?: boolean;
    readingTime: number; // minutes
    publishedDate: string;
    lastUpdated: string;
    relatedArticles: string[]; // IDs
    videoPlaceholder?: string; // Description for NotebookLM video
    heroImage?: string; // Path to hero image in /public
    video?: string;
    videoDuration?: string; // e.g. "2 min"
    keywords?: string[];
    author: string;
}

export const articles: ArticleMetadata[] = [
    // Pillar Pages
    {
        id: 'pillar-gallery-walls',
        slug: 'complete-guide-to-gallery-walls',
        title: 'The Complete Guide to Gallery Walls',
        description: 'Everything you need to know about designing, planning, and installing beautiful gallery walls in your home.',
        category: 'Design 101',
        pillar: true,
        readingTime: 12,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['gallery-wall-styles', 'choosing-frame-sizes', 'spacing-alignment'],
        video: '/learn/video-gallery-walls.mp4',
        videoDuration: '3 min video',
        heroImage: '/learn/hero-gallery-walls.webp',
        keywords: ['gallery wall guide', 'how to design a gallery wall', 'gallery wall ideas', 'picture wall tutorial'],
        author: 'Timothy Straub'
    },
    {
        id: 'pillar-app-guide',
        slug: 'galleryplanner-user-guide',
        title: 'GalleryPlanner: Complete User Guide',
        description: 'Master GalleryPlanner with this comprehensive walkthrough of features, tips, and best practices.',
        category: 'App Guides',
        pillar: true,
        readingTime: 10,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['getting-started', 'smart-layout', 'spacing-alignment'],
        video: '/learn/video-galleryplanner-guide.mp4',
        videoDuration: '2 min video',
        heroImage: '/learn/hero-user-guide.webp',
        keywords: ['GalleryPlanner tutorial', 'how to use GalleryPlanner', 'gallery wall planner app', 'gallery wall software'],
        author: 'Timothy Straub'
    },

    // Cluster Articles - App Guides
    {
        id: 'getting-started',
        slug: 'getting-started-with-galleryplanner',
        title: 'Getting Started with GalleryPlanner',
        description: 'A quick-start guide to creating your first gallery wall layout in just 5 minutes.',
        category: 'App Guides',
        readingTime: 5,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-app-guide', 'smart-layout'],
        heroImage: '/learn/hero-getting-started.webp',
        keywords: ['GalleryPlanner quick start', 'how to start with GalleryPlanner', 'gallery wall planner beginner'],
        author: 'Timothy Straub'
    },
    {
        id: 'smart-layout',
        slug: 'understanding-smart-layout',
        title: 'Understanding Smart Layout: AI-Powered Gallery Wall Design',
        description: 'Learn how GalleryPlanner\'s AI algorithms can automatically generate professional gallery wall layouts.',
        category: 'App Guides',
        readingTime: 7,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-app-guide', 'getting-started'],
        video: '/learn/video-smart-layout.mp4',
        videoDuration: '1 min video',
        heroImage: '/learn/hero-smart-layout.webp',
        keywords: ['GalleryPlanner smart layout', 'AI gallery wall layout', 'automatic gallery wall design', 'gallery wall algorithm'],
        author: 'Timothy Straub'
    },
    {
        id: 'pro-features-guide',
        slug: 'what-is-galleryplanner-pro',
        title: 'What is GalleryPlanner Pro?',
        description: 'Discover Pro features like Smart Layout, PDF hanging guides, and project backup—all free during beta.',
        category: 'App Guides',
        readingTime: 5,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-app-guide', 'smart-layout', 'getting-started'],
        heroImage: '/learn/hero-pro-features.webp',
        keywords: ['GalleryPlanner Pro', 'Pro features', 'GalleryPlanner pricing', 'Smart Layout', 'PDF hanging guide'],
        author: 'Timothy Straub'
    },

    // Cluster Articles - Design 101
    {
        id: 'gallery-wall-styles',
        slug: 'gallery-wall-styles-explained',
        title: 'Gallery Wall Styles Explained: Find Your Perfect Aesthetic',
        description: 'Explore different gallery wall styles from classic grid layouts to eclectic salon walls.',
        category: 'Design 101',
        readingTime: 6,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-gallery-walls', 'choosing-frame-sizes'],
        heroImage: '/learn/hero-gallery-wall-styles.webp',
        keywords: ['gallery wall styles', 'types of gallery walls', 'gallery wall ideas', 'salon wall', 'grid gallery wall'],
        author: 'Timothy Straub'
    },
    {
        id: 'choosing-frame-sizes',
        slug: 'choosing-frame-sizes',
        title: 'Choosing the Right Frame Sizes for Your Gallery Wall',
        description: 'Master the art of mixing frame sizes to create visual interest and balanced compositions.',
        category: 'Design 101',
        readingTime: 6,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-gallery-walls', 'gallery-wall-styles', 'spacing-alignment'],
        heroImage: '/learn/hero-frame-sizes.webp',
        keywords: ['best frame sizes for gallery wall', 'gallery wall frame proportions', 'mixing frame sizes', 'standard frame sizes'],
        author: 'Timothy Straub'
    },
    {
        id: 'spacing-alignment',
        slug: 'spacing-and-alignment-tips',
        title: 'Gallery Wall Spacing & Alignment: The Golden Rules',
        description: 'Learn the professional techniques for perfect spacing and alignment in your gallery wall.',
        category: 'Design 101',
        readingTime: 7,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-gallery-walls', 'choosing-frame-sizes'],
        heroImage: '/learn/hero-spacing.webp',
        keywords: ['gallery wall spacing', 'how to align gallery wall frames', 'picture spacing guidelines', 'gallery wall measurements'],
        author: 'Timothy Straub'
    },

    // Installation Guides
    {
        id: 'staircase-gallery-walls',
        slug: 'staircase-gallery-walls',
        title: 'Conquering the Slope: Staircase Gallery Wall Design',
        description: 'Master the geometry of diagonal layouts with our complete guide to staircase gallery walls.',
        category: 'Installation',
        readingTime: 8,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-gallery-walls', 'hanging-hardware-guide', 'spacing-alignment'],
        heroImage: '/learn/hero-staircase.webp',
        keywords: ['staircase gallery wall', 'diagonal gallery wall', 'stair angle frames', 'sloped wall art'],
        author: 'Timothy Straub'
    },
    {
        id: 'hanging-hardware-guide',
        slug: 'hanging-hardware-guide',
        title: 'The Ultimate Hanging Hardware Guide',
        description: 'Everything you need to know about wall anchors, picture hooks, and damage-free hanging.',
        category: 'Installation',
        readingTime: 7,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['staircase-gallery-walls', 'spacing-alignment', 'pillar-gallery-walls'],
        heroImage: '/learn/hero-hardware.webp',
        keywords: ['picture hanging hardware', 'wall anchors', 'toggle bolts', 'damage-free hanging', 'command strips'],
        author: 'Timothy Straub'
    },
    {
        id: 'renter-friendly-galleries',
        slug: 'renter-friendly-galleries',
        title: 'Renter-Friendly Gallery Walls: Big Impact, Zero Holes',
        description: 'Create stunning gallery walls without damaging your walls—perfect for renters and anyone who wants flexibility.',
        category: 'Installation',
        readingTime: 5,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['hanging-hardware-guide', 'spacing-alignment', 'pillar-gallery-walls'],
        heroImage: '/learn/hero-renter.webp',
        keywords: ['renter gallery wall', 'damage-free hanging', 'command strips', 'picture ledges', 'no-drill gallery wall'],
        author: 'Timothy Straub'
    },

    // App Guides (Privacy)
    {
        id: 'local-first-privacy',
        slug: 'local-first-privacy',
        title: 'Why Your Home Data Should Stay Home: The Local-First Advantage',
        description: 'How GalleryPlanner keeps your photos private with local-first architecture—no cloud uploads, no accounts.',
        category: 'App Guides',
        readingTime: 5,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-app-guide', 'getting-started'],
        heroImage: '/learn/hero-privacy.webp',
        keywords: ['privacy', 'local-first', 'data ownership', 'offline gallery wall app', 'photo privacy'],
        author: 'Timothy Straub'
    },

    // Design 101 (Advanced Topics)
    {
        id: 'print-resolution-guide',
        slug: 'print-resolution-guide',
        title: 'From Pixel to Print: Understanding DPI for Large Format Art',
        description: 'Avoid blurry prints by understanding DPI, PPI, and resolution requirements for gallery wall art.',
        category: 'Design 101',
        readingTime: 6,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['pillar-gallery-walls', 'pillar-app-guide'],
        heroImage: '/learn/hero-print-resolution.webp',
        keywords: ['DPI', 'print resolution', 'photo printing', 'large format art', 'pixel to print'],
        author: 'Timothy Straub'
    },
    {
        id: 'corner-gallery-walls',
        slug: 'corner-gallery-walls',
        title: 'Wrapping the Room: Gallery Walls That Navigate Corners',
        description: 'Design strategies for gallery walls that span two perpendicular walls with seamless flow.',
        category: 'Design 101',
        readingTime: 6,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['gallery-wall-styles', 'spacing-alignment', 'pillar-gallery-walls'],
        heroImage: '/learn/hero-corner.webp',
        keywords: ['corner gallery wall', 'L-shaped gallery wall', 'wrapping gallery wall', 'two-wall gallery'],
        author: 'Timothy Straub'
    },
    {
        id: 'color-curation-guide',
        slug: 'color-curation-guide',
        title: 'The Art of Curation: Mixing Color and Black & White Photography',
        description: 'Make mismatched photos feel cohesive with the 70/30 rule and color psychology principles.',
        category: 'Design 101',
        readingTime: 6,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['gallery-wall-styles', 'pillar-gallery-walls'],
        heroImage: '/learn/hero-color-curation.webp',
        keywords: ['photo curation', 'color mixing', 'black and white photos', 'gallery wall curation', 'color psychology'],
        author: 'Timothy Straub'
    },
    {
        id: 'frame-tv-gallery-walls',
        slug: 'frame-tv-gallery-walls',
        title: 'The Frame TV Gallery: Blending Screens with Physical Art',
        description: 'Build a gallery wall that makes your TV feel like part of the collection, not a black hole.',
        category: 'Design 101',
        readingTime: 5,
        publishedDate: '2026-02-07',
        lastUpdated: '2026-02-07',
        relatedArticles: ['gallery-wall-styles', 'choosing-frame-sizes', 'pillar-gallery-walls'],
        heroImage: '/learn/hero-frame-tv.webp',
        keywords: ['TV gallery wall', 'Samsung Frame', 'TV art wall', 'television gallery wall'],
        author: 'Timothy Straub'
    }
];

// Helper function to get article by slug
export const getArticleBySlug = (slug: string): ArticleMetadata | undefined => {
    return articles.find(article => article.slug === slug);
};

// Helper function to get related articles
export const getRelatedArticles = (articleId: string, limit: number = 3): ArticleMetadata[] => {
    const article = articles.find(a => a.id === articleId);
    if (!article) return [];

    return article.relatedArticles
        .map(id => articles.find(a => a.id === id))
        .filter((a): a is ArticleMetadata => a !== undefined)
        .slice(0, limit);
};

// Helper function to get articles by category
export const getArticlesByCategory = (category: ArticleMetadata['category']): ArticleMetadata[] => {
    return articles.filter(article => article.category === category);
};

// Helper function to get all pillar pages
export const getPillarPages = (): ArticleMetadata[] => {
    return articles.filter(article => article.pillar === true);
};
