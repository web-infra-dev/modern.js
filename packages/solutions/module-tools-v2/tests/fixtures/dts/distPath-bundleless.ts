import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: {
      distPath: './types',
    },
    outdir: './dist/bundleless-dist-path',
  },
});
