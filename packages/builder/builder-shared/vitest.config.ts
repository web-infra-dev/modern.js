import { defineConfig } from 'vitest/config';
import { withTestPreset } from '@scripts/vitest-config';

const config = defineConfig({
  test: {
    root: __dirname,
    environment: 'node',
  },
});

export default withTestPreset(config);
