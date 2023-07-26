import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      only: true,
    },
    outDir: './dist/only-bundle',
  },
});
