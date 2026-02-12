import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';
import { articles } from '../src/content/articles/articleRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

async function prerender() {
    console.log('🚀 Starting Prerender (Vite SSR Mode)...');

    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error('❌ Error: dist/index.html not found. Run "vite build" first.');
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

    // Create Vite server in middleware mode to handle asset transformations
    const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'custom'
    });

    try {
        // Load the server entry point
        const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');

        interface RoutePath {
            path: string;
            name: string;
            id?: string;
            title?: string;
            description?: string;
        }

        const routes: RoutePath[] = [
            { path: '/', name: 'index' },
            { path: '/about', name: 'about' },
            { path: '/help', name: 'help' },
            { path: '/privacy', name: 'privacy' },
            { path: '/changelog', name: 'changelog' },
            { path: '/learn', name: 'learn' },
            ...articles.map(article => ({
                path: `/learn/${article.slug}`,
                name: `learn/${article.slug}`,
                id: article.id,
                title: article.title,
                description: article.description
            }))
        ];

        for (const route of routes) {
            process.stdout.write(`  - Rendering ${route.path}... `);

            try {
                let data = {};
                // If it's an article, pre-load the content
                if (route.id) {
                    const articlePath = path.join(__dirname, `../src/content/articles/${route.id}.md`);
                    if (fs.existsSync(articlePath)) {
                        data = { content: fs.readFileSync(articlePath, 'utf-8') };
                    }
                }

                const appHtml = await render(route.path, data);

                let html = template.replace('<!--app-html-->', appHtml);
                // Fallback for older index.html without the comment
                if (html === template) {
                    html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
                }

                if (route.title) {
                    html = html.replace(/<title>.*?<\/title>/, `<title>${route.title} — GalleryPlanner</title>`);
                }
                if (route.description) {
                    html = html.replace(
                        /<meta name="description" content=".*?" \/>/,
                        `<meta name="description" content="${route.description}" />`
                    );
                }

                const outputDir = path.join(DIST_DIR, route.path);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                fs.writeFileSync(path.join(outputDir, 'index.html'), html);
                console.log('✅');
            } catch (e) {
                console.log('❌');
                console.error(`    Error rendering ${route.path}:`, e);
            }
        }
    } finally {
        await vite.close();
    }

    console.log('🎉 Prerendering complete!');
}

prerender().catch(err => {
    console.error('💥 Prerender failed:', err);
    process.exit(1);
});
