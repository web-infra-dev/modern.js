import { defineConfig } from '@rstest/core';

export default defineConfig({
  root: __dirname,
  include: [
    'integration/**/*.(spec|test).[jt]s?(x)',
    'e2e/storybook/*.test.ts',
  ],
  exclude: ['integration/rstest/**'],
  globals: true,
  // Framework tests spawn many build/dev-server/puppeteer tasks; cap file-level
  // concurrency to avoid CI resource contention without changing assertions.
  pool: {
    maxWorkers: '50%',
  },
  retry: 1,
  testTimeout: 60_000,
  hookTimeout: 60_000,
});
