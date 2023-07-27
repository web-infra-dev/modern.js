import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: false,
    outDir: './dist/false-bundleless',
  },
});
