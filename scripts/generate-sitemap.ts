import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { articles } from '../src/content/articles/articleRegistry';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITEMAP_PATH = path.join(__dirname, '../public/sitemap.xml');
const BASE_URL = 'https://gallery-planner.com';
const CURRENT_DATE = new Date().toISOString().split('T')[0];

console.log('Generating sitemap...');

const generateSitemap = () => {
    const staticPages = [
        '',
        '/app',
        '/about',
        '/privacy',
        '/help',
        '/resources'
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticPages.map(page => `
    <url>
        <loc>${BASE_URL}${page}</loc>
        <lastmod>${CURRENT_DATE}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${page === '' ? '1.0' : '0.8'}</priority>
    </url>
    `).join('')}
    ${articles.map(article => `
    <url>
        <loc>${BASE_URL}/resources/${article.slug}</loc>
        <lastmod>${article.lastUpdated}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    `).join('')}
</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, sitemap);
    console.log(`✅ Sitemap generated at ${SITEMAP_PATH}`);
    console.log(`   - ${staticPages.length} static pages`);
    console.log(`   - ${articles.length} articles`);
};

generateSitemap();
