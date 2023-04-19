import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    target: 'esnext',
    outDir: './dist',
    input: ['./src/index.ts'],
    esbuildOptions: c => {
      c.format = 'cjs';
      return c;
    },
  },
});
