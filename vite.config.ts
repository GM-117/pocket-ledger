import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 部署在 /pocket-ledger/ 子路径下，本地开发与预览保持根路径
const base = process.env.DEPLOY_TARGET === 'gh-pages' ? '/pocket-ledger/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
});
