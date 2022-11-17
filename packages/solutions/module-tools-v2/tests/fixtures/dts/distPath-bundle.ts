// import path from 'path';
import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      distPath: './types',
    },
    outdir: './dist/bundle-dist-path',
  },
});
