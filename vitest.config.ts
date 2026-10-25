import { defineConfig } from 'vitest/config';

/** 识别内核全是纯文本函数，用 node 环境即可，无需 jsdom */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
});
