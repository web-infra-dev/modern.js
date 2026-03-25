import { defineConfig } from '@rstest/core';

export default defineConfig({
  root: __dirname,
  testEnvironment: 'node',
  output: {
    externals: {
      '@modern-js/app-tools': 'commonjs @modern-js/app-tools',
    },
  },
});
