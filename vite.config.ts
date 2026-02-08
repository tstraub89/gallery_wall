import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

// Custom plugin to load .md files as raw strings
function markdownPlugin() {
  return {
    name: 'vite-plugin-markdown',
    transform(code: string, id: string) {
      if (id.endsWith('.md')) {
        return `export default ${JSON.stringify(code)}`;
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      markdownPlugin(),
    ],
    // Custom domain and Vercel use root base path.
    base: '/',
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    build: {
      chunkSizeWarningLimit: 1000,
    },
    worker: {
      format: 'es' as 'es',
    },
  };
});
