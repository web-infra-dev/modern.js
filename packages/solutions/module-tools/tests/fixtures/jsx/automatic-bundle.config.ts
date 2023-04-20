import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'automatic',
    externals: [/^react\/*/],
    outDir: './dist/automatic/bundle',
  },
});
