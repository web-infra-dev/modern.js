import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  root: __dirname,
  testEnvironment: 'node',
  setupFiles: ['@scripts/rstest-config/setup.ts'],
});
