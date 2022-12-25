import { defineConfig } from 'vitest/config';
import { withTestPreset } from '@scripts/vitest-config';
import path from 'path';

const config = defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname, 'src'),
      '@builder': path.resolve(__dirname, '../builder/src'),
    }
  },
  test: {
    root: __dirname,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
});

export default withTestPreset(config);
