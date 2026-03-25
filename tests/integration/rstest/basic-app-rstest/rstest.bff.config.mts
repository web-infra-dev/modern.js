import { defineConfig } from '@rstest/core';

// Docs: https://rstest.rs/config/
export default defineConfig({
  name: 'basic-app-rstest-bff',
  include: ['./tests/api.test.ts'],
});
