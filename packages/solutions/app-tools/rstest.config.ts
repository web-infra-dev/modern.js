import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  root: __dirname,
  testEnvironment: 'node',
  globals: true,
  tools: {
    rspack: {
      optimization: {
        // Disable tree shaking to avoid issues with rstest mocking '@modern-js/utils'.
        providedExports: false,
      },
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
