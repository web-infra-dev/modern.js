import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  root: __dirname,
  testEnvironment: 'happy-dom',
  globals: true,
});
