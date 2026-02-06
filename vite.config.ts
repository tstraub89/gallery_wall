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
      chunkSizeWarningLimit: 1000,
    }
  };
});
