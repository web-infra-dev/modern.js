import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  root: __dirname,
  testEnvironment: 'node',
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  resolve: {
    // Add 'import' condition to prioritize ESM imports for rsbuild-plugin-rsc
    // This avoids the CJS -> ESM require() issue(@rsbuild/core)
    conditionNames: ['modern:source', 'import', 'require', 'node', 'default'],
  },
});
