import { defineConfig } from '@rstest/core';

export default defineConfig({
  root: __dirname,
  testEnvironment: 'node',
  testTimeout: 30000,
  include: ['tests/**/*.test.ts'],
});
