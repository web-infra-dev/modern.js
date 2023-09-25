import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: false,
    outDir: './dist/false-bundle',
  },
});
