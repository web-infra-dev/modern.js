import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts'],
    platform: 'browser',

    outdir: './dist/browser',
  },
});
