import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts'],
    splitting: true,
    format: 'cjs',
    outDir: './dist/cjs',
  },
});
