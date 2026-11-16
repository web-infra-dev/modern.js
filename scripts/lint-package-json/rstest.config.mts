import { defineConfig } from '@rstest/core';

export default defineConfig({
  root: __dirname,
  testEnvironment: 'node',
  include: ['tests/**/*.test.ts'],
  testTimeout: 30_000,
});
