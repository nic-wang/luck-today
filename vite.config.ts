import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isCapacitor = process.env.CAPACITOR === '1';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  // GH Pages 用 /luck-today/；Capacitor 本地包用相对路径
  base: isCapacitor ? './' : '/luck-today/',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true
  }
});
