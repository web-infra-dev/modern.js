import path from 'path';
import { withTestPreset } from '@scripts/vitest-config';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    root: __dirname,
    environment: 'node',
    globals: true,
    includeSource: ['src/utils/*.ts'],
  },
});

export default withTestPreset(config);
