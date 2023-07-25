import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: {
      main: './src/index.ts',
    },
    outDir: './dist/object',
  },
});
