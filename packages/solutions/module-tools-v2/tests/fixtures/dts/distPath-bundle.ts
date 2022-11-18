// import path from 'path';
import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      distPath: './types',
    },
    outdir: './dist/bundle-dist-path',
  },
});
