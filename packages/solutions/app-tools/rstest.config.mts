import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  root: __dirname,
  testEnvironment: 'node',
  globals: true,
  tools: {
    rspack: {
      module: {
        parser: {
          javascript: {
            // Enable parse and compile of `require.resolve` syntax.
            requireResolve: true,
          },
        },
      },
    },
  },
});
