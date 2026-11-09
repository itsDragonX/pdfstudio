import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Support customizable base path for GitHub Pages subpath deployment (e.g. /pdfstudio/)
// or relative './' by default for maximum portability.
const basePath = process.env.VITE_BASE_PATH || './';

// https://vitejs.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pdf.worker.min.mjs'],
      manifest: {
        name: 'PDF Studio',
        short_name: 'PDFStudio',
        description: 'Professional Offline-First Client-Side PDF Suite',
        theme_color: '#3159D9',
        background_color: '#F5F7FA',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mjs,ttf,woff,woff2,bcmap,pfb}']
      }
    })
  ],
  build: {
    target: 'esnext'
  },
  worker: {
    format: 'es'
  }
});
