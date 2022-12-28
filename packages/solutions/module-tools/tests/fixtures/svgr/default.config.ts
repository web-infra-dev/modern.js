import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    target: 'es2021',
    buildType: 'bundle',
    outDir: './dist/default',
    externals: [/^react/],
    format: 'esm',
  },
});
