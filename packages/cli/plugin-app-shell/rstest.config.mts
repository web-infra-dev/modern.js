import { withTestPreset } from '@scripts/rstest-config';

export default {
  projects: [
    withTestPreset({
      name: 'plugin-app-shell-node',
      root: __dirname,
      testEnvironment: 'node',
      globals: true,
      include: ['tests/inject.test.ts', 'tests/critical-css.test.ts'],
    }),
    withTestPreset({
      name: 'plugin-app-shell-dom',
      root: __dirname,
      testEnvironment: 'happy-dom',
      globals: true,
      include: ['tests/runtime.test.ts'],
    }),
  ],
};
