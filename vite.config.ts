import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/alphamove/' : '/',
  build: {
    target: ['es2020', 'safari14'],
    outDir: 'docs',
    emptyOutDir: true,
  },
}));
