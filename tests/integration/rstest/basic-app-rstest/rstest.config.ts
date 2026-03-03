import { withModernConfig } from '@modern-js/adapter-rstest';
import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  name: 'basic-app-rstest',
  extends: withModernConfig({
    cwd: __dirname,
  }),
  setupFiles: ['./tests/rstest.setup.ts'],
  exclude: ['./tests/api.test.ts'],
});
