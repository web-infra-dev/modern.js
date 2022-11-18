import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    outdir: './dist/bundle',
  },
});
