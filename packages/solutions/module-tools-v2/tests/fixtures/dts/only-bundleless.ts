import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outdir: './dist/only-bundleless',
  },
});
