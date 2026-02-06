import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    // Custom domain and Vercel use root base path.
    base: '/',
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase slightly for the heavy PDF worker if needed
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
            'vendor-ui': ['lucide-react', 'clsx', 'react-markdown'],
            'vendor-utils': ['jszip', 'file-saver', 'uuid'],
            'vendor-analytics': ['posthog-js', '@vercel/speed-insights']
          }
        }
      }
    }
  };
});
