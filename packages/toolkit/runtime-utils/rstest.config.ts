import { withTestPreset } from '@scripts/rstest-config';

export default {
  projects: [
    withTestPreset({
      name: 'runtime-utils-node',
      root: __dirname,
      testEnvironment: 'node',
      exclude: [
        'tests/universal/cache-client.test.ts',
        'tests/browser/**/*.{test,spec}.{js,cjs,mjs,ts,tsx}',
      ],
      globals: true,
    }),
    withTestPreset({
      name: 'runtime-utils-client',
      root: __dirname,
      testEnvironment: 'jsdom',
      include: [
        'tests/universal/cache-client.test.ts',
        'tests/browser/**/*.{test,spec}.{js,cjs,mjs,ts,tsx}',
      ],
      globals: true,
    }),
  ],
};
