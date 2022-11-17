import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    jsx: 'automatic',
    outdir: './dist/automatic/bundleless',
  },
});
