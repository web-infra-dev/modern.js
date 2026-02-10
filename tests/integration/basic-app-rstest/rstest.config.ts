import { withModernConfig } from '@modern-js/adapter-rstest';
import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  extends: withModernConfig({
    cwd: __dirname,
  }),
  setupFiles: ['./tests/rstest.setup.ts'],
});
