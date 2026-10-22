import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  root: __dirname,
  globals: true,
  env: {
    npm_package_name: 'tests',
  },
});
