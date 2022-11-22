import path from 'path';
import { defineConfig } from 'vitest/config';
import { withTestPreset } from '@scripts/vitest-config';

const config = defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname),
      '@': path.resolve(__dirname, 'src'),
    }
  },
  test: {
    root: __dirname,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
});

export default withTestPreset(config);
