import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'esm',
    target: 'esnext',
    outDir: './dist/redirect',
  },
});
