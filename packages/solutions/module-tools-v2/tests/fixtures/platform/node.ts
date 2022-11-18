import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts'],
    platform: 'node',

    outdir: './dist/node',
  },
});
