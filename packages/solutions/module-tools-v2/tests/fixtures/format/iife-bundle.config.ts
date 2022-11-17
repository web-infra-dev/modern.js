import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'iife',
    outdir: './dist/bundle',
  },
});
