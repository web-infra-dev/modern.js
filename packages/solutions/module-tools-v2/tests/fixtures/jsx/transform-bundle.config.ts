import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'transform',
    outdir: './dist/transform/bundle',
  },
});
