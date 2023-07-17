import { defineConfig } from 'vitest/config';
import { withTestPreset } from '@scripts/vitest-config';

const config = defineConfig({
  test: {
    root: __dirname,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/utils.ts'],
  },
});

export default withTestPreset(config);
