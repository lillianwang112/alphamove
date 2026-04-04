import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { writeFileSync } from 'fs';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/alphamove/index.html',
        navigateFallbackAllowlist: [/^\/alphamove/],
        runtimeCaching: [
          {
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
    // Write a version.json with the build timestamp so the inline version-check
    // script in index.html can detect new deployments and force a reload.
    {
      name: 'version-json',
      closeBundle() {
        writeFileSync('docs/version.json', JSON.stringify({ v: Date.now().toString() }));
      },
    },
  ],
  base: mode === 'production' ? '/alphamove/' : '/',
  build: {
    target: ['es2020', 'safari14'],
    outDir: 'docs',
    emptyOutDir: true,
  },
}));
