import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  root: __dirname,
  testEnvironment: 'node',
  globals: true,
});
