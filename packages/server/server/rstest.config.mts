import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  globals: true,
});
