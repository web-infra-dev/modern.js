import { defineConfig } from '@rstest/core';

export default defineConfig({
  root: __dirname,
  include: ['integration/**/*.(spec|test).[jt]s?(x)'],
  exclude: ['integration/rstest/**'],
  globals: true,
  retry: 1,
  testTimeout: 60_000,
  hookTimeout: 60_000,
});
