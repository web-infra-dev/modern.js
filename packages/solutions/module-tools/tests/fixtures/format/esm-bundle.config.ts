import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    sourceType: 'commonjs',
    target: 'es5',
    format: 'esm',
    outDir: './dist/bundle',
  },
});
