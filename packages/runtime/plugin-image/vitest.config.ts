import { withTestPreset } from '@scripts/vitest-config';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
  test: {
    root: __dirname,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src'],
      exclude: ['**/*.stories.*'],
    },
  },
  define: {
    __INTERNAL_MODERNJS_IMAGE_OPTIONS__: { quality: 90 },
  },
});

export default withTestPreset(config);
