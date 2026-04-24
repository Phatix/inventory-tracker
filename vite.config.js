import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Inventory Tracker',
        short_name: 'Inventory',
        description: 'Offline-First Micro-ERP für Einkauf, Bestand, Verkauf',
        theme_color: '#0a0f0d',
        background_color: '#0a0f0d',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="45" fill="%230a0f0d"/><path d="M48 132V60l48-24 48 24v72l-48 24-48-24z" fill="none" stroke="%234ade80" stroke-width="12" stroke-linejoin="round"/></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="120" fill="%230a0f0d"/><path d="M128 352V160l128-64 128 64v192l-128 64-128-64z" fill="none" stroke="%234ade80" stroke-width="32" stroke-linejoin="round"/></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
        categories: ['productivity', 'business'],
        screenshots: [
          {
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 720"><rect width="540" height="720" fill="%230a0f0d"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="%234ade80" font-size="48" font-family="sans-serif">Inventory Tracker</text></svg>',
            sizes: '540x720',
            form_factor: 'narrow',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/rsms\.me\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
