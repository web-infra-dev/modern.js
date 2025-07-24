import { withTestPreset } from '@scripts/vitest-config';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    root: __dirname,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
});

export default withTestPreset(config);
