import { defineConfig } from '@rstest/core';

export default defineConfig({
  projects: [
    'packages/**/rstest.config.{ts,mts}',
    'scripts/check-changeset/rstest.config.mts',
    'scripts/rslib/rstest.config.mts',
  ],
});
