import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'preserve',
    outDir: './dist/preserve',
  },
});
