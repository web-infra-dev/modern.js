import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'esm',
    target: 'esnext',
    outDir: './dist/redirect',
  },
});
