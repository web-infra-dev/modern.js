import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      only: true,
    },
    outDir: './dist/only-bundle',
  },
});
