import { defineConfig } from '@rstest/core';

export default defineConfig({
  root: __dirname,
  testEnvironment: 'node',
  globals: true,
  include: ['tests/rsc-client-callback-bootstrap.test.ts'],
});
