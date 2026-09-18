import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 部署在 /pocket-ledger/ 子路径下，本地开发与预览保持根路径
const base = process.env.DEPLOY_TARGET === 'gh-pages' ? '/pocket-ledger/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  // 本机其他 Vite 项目只占 [::1]:5173，IPv4 的 5173 仍可绑，Vite 会误判为空闲、localhost 打到错项目
  server: { host: true, port: 5273, strictPort: true },
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
