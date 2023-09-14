import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    outDir: './dist/tsconfig',
    buildType: 'bundle',
  },
});
