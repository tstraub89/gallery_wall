import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { articles } from '../src/content/articles/articleRegistry';

// ESM dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_PATH = path.join(__dirname, '../public/rss.xml');
const ARTICLES_DIR = path.join(__dirname, '../src/content/articles');
const BASE_URL = 'https://gallery-planner.com';

console.log('Generating RSS feed...');

const getEffectiveDate = (articleId: string, registeredDate: string) => {
    const filePath = path.join(ARTICLES_DIR, `${articleId}.md`);
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileMtime = stats.mtime;
            const regDate = new Date(registeredDate);

            // Return the later of the two dates
            return fileMtime > regDate ? fileMtime.toUTCString() : regDate.toUTCString();
        }
    } catch (e) {
        console.warn(`Could not check mtime for ${articleId}`);
    }
    return new Date(registeredDate).toUTCString();
};

const generateRSS = () => {
    const items = articles.map(article => {
        const pubDate = getEffectiveDate(article.id, article.lastUpdated);
        const link = `${BASE_URL}/resources/${article.slug}`;

        return `
        <item>
            <title><![CDATA[${article.title}]]></title>
            <link>${link}</link>
            <guid isPermaLink="true">${link}</guid>
            <description><![CDATA[${article.description}]]></description>
            <pubDate>${pubDate}</pubDate>
            <author>${article.author}</author>
            ${article.heroImage ? `<enclosure url="${BASE_URL}${article.heroImage}" length="0" type="image/webp" />` : ''}
            <category>${article.category}</category>
        </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>GalleryPlanner Design Guides</title>
    <link>${BASE_URL}/learn</link>
    <description>Learn how to design, plan, and install beautiful gallery walls with our comprehensive guides.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
</channel>
</rss>`;

    fs.writeFileSync(RSS_PATH, rss);
    console.log(`✅ RSS feed generated at ${RSS_PATH}`);
    console.log(`   - ${articles.length} articles included`);
};

generateRSS();
