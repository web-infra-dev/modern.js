import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outdir: './dist/only-bundleless',
  },
});
