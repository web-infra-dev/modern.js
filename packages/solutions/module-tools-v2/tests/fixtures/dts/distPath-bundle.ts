// import path from 'path';
import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      distPath: './types',
    },
    path: './dist/bundle-dist-path',
  },
});
