import { defineConfig } from '@rstest/core';
import { selectFiles } from './scripts/groups.mjs';
import MFReporter from './scripts/reporter.mjs';

export default defineConfig({
  root: import.meta.dirname,
  include: selectFiles(),
  globals: true,
  testTimeout: 60000,
  hookTimeout: 600000,
  retry: 0,
  pool: { maxWorkers: 1 },
  passWithNoTests: false,
  reporters: process.env.MF_LAB_ARTIFACT_DIR
    ? ['default', new MFReporter()]
    : ['default'],
});
