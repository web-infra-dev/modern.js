import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    sourceType: 'commonjs',
    target: 'es5',
    format: 'esm',
    outDir: './dist/bundle',
  },
});
