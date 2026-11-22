import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The DICOM viewer lives in ../imaging (separate from the main UI).
    alias: { '@imaging': fileURLToPath(new URL('../imaging', import.meta.url)) },
    // imaging/ has no node_modules of its own: use the frontend's copies.
    dedupe: ['react', 'react-dom', 'gsap'],
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    // The browser calls /api on the same origin; Vite forwards it to Express.
    proxy: { '/api': 'http://localhost:4000' },
  },
});
