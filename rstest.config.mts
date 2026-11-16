import { defineConfig } from '@rstest/core';

export default defineConfig({
  projects: [
    'packages/**/rstest.config.{ts,mts}',
    'scripts/rslib/rstest.config.mts',
    'scripts/lint-package-json/rstest.config.mts',
  ],
});
