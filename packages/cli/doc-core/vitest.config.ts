import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    threads: true,
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
});
