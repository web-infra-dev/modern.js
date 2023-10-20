import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts'],
    minify: 'terser',
    format: 'umd',
    outDir: './dist/umd',
  },
});
