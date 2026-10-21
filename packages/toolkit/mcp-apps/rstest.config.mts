import { withTestPreset } from '@scripts/rstest-config';

export default {
  projects: [
    withTestPreset({
      name: 'node',
      root: __dirname,
      testEnvironment: 'node',
      globals: true,
      exclude: ['tests/remote-lifecycle.test.tsx'],
    }),
    withTestPreset({
      name: 'ui',
      root: __dirname,
      testEnvironment: 'happy-dom',
      globals: true,
      include: ['tests/remote-lifecycle.test.tsx'],
    }),
  ],
};
