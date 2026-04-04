import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Immediately take control when a new version is detected
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        // Always fetch the HTML from the network so users get the latest version
        navigateFallback: '/alphamove/index.html',
        navigateFallbackAllowlist: [/^\/alphamove/],
        runtimeCaching: [
          {
            // Cache API calls with network-first (fresh data, fallback to cache)
            urlPattern: /^https:\/\/(finnhub\.io|financialmodelingprep\.com)/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxAgeSeconds: 300 } },
          },
        ],
      },
      manifest: {
        name: 'AlphaMove',
        short_name: 'AlphaMove',
        description: 'Chess.com meets Duolingo for investing',
        theme_color: '#08080F',
        background_color: '#08080F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/alphamove/',
        scope: '/alphamove/',
        icons: [
          { src: '/alphamove/icons.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  base: mode === 'production' ? '/alphamove/' : '/',
  build: {
    target: ['es2020', 'safari14'],
    outDir: 'docs',
    emptyOutDir: true,
  },
}));
