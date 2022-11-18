import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'transform',
    outdir: './dist/transform/bundle',
  },
});
