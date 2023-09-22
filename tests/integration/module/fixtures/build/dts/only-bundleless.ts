import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    outDir: './dist/only-bundleless',
  },
});
