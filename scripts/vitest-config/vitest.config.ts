import { defineConfig } from 'vitest/config';
import { withTestPreset } from './';

const config = defineConfig({
  test: {
    root: __dirname,
    environment: 'node',
  },
});

export default withTestPreset(config);
