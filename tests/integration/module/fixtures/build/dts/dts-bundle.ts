// import path from 'path';
import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      distPath: './types',
      only: true,
      respectExternal: false,
    },
    outDir: './dist/bundle',
  },
});
