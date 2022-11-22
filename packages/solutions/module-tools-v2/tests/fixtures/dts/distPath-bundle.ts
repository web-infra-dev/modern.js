// import path from 'path';
import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      distPath: './types',
    },
    outdir: './dist/bundle-dist-path',
  },
});
