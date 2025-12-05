import { withTestPreset } from '@scripts/rstest-config';

export default {
  projects: [
    withTestPreset({
      name: 'create-request-node',
      root: __dirname,
      testEnvironment: 'node',
      exclude: ['tests/browser.test.ts'],
      globals: true,
    }),
    withTestPreset({
      name: 'create-request-client',
      root: __dirname,
      testEnvironment: 'jsdom',
      include: ['tests/browser.test.ts'],
      globals: true,
    }),
  ],
};
