import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const API_TARGET = process.env.VITE_API_TARGET || 'http://127.0.0.1:1234';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      // 后端 BasicApi：/api/xxx -> http://127.0.0.1:1234/api/xxx
      '/api': { target: API_TARGET, changeOrigin: true },
      // 图片服务
      '/img': { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
});
