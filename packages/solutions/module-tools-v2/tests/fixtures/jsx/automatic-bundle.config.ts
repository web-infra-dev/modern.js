import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'automatic',
    outdir: './dist/automatic/bundle',
  },
});
