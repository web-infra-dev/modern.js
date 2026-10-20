import { defineConfig } from '@rstest/core';
export default defineConfig({
  root: import.meta.dirname,
  include: ['test/**/*.test.ts'],
  globals: true,
  testTimeout: 60000,
  hookTimeout: 600000,
  retry: 0,
  pool: { maxWorkers: 1 },
});
