import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: {
      main: './src/index.ts',
    },
    outdir: './dist/object',
  },
});
