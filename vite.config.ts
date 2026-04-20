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
          { src: '/alphamove/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-128x128.png', sizes: '128x128', type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-144x144.png', sizes: '144x144', type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-152x152.png', sizes: '152x152', type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-167x167.png', sizes: '167x167', type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-180x180.png', sizes: '180x180', type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any maskable' },
          { src: '/alphamove/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
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
