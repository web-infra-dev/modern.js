import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: false,
    outDir: './dist/false-bundleless',
  },
});
