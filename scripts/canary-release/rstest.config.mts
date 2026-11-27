import { defineConfig } from '@rstest/core';

// Run on its own, not from the root projects: these tests drive git, tar and
// pnpm on POSIX paths and are run by the release workflows on Linux.
export default defineConfig({
  root: __dirname,
  testEnvironment: 'node',
  include: ['*.test.mjs'],
  // The real-toolchain tests run Changesets and pnpm pack.
  testTimeout: 120_000,
});
