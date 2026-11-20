import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  setupFiles: ['@scripts/rstest-config/setup.ts'],
  root: __dirname,
  globals: true,
  // Discovered handlers run in Node. Use their copy of ValidationError in the server plugin too.
  output: {
    externals: { '@modern-js/bff-core': 'import @modern-js/bff-core' },
  },
  env: {
    npm_package_name: 'tests',
  },
});
