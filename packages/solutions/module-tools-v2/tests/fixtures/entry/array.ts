import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts', './src/browser.ts'],
    outdir: './dist/array',
  },
});
