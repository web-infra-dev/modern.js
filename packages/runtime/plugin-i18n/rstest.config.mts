import path from 'path';
import { withTestPreset } from '@scripts/rstest-config';

export default withTestPreset({
  root: __dirname,
  testEnvironment: 'node',
  globals: true,
  resolve: {
    alias: {
      '@modern-js/runtime': path.join(__dirname, 'tests/mocks/runtime.ts'),
    },
  },
});
