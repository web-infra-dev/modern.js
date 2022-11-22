import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: false,
    outdir: './dist/false-bundleless',
  },
});
