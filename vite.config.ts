import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative paths work on any server/subdirectory
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});