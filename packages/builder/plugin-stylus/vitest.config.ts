import { defineConfig } from 'vitest/config';
import { withTestPreset } from '@scripts/vitest-config';
import path from 'path';

const config = defineConfig({
  test: {
    root: __dirname,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@rspack-builder/tests': path.resolve(__dirname, '../builder-rspack-provider/tests'),
    }
  },
});

export default withTestPreset(config);
