import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'automatic',
    externals: [/^react\/*/],
    outDir: './dist/automatic/bundle',
  },
});
