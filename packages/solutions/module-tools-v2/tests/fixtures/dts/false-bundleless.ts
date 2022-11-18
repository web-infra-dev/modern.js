import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: false,
    outdir: './dist/false-bundleless',
  },
});
