import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: {
      main: './src/index.ts',
    },
    outdir: './dist/object',
  },
});
