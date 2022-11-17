import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      path: './asset',
      limit: 0,
    },
    outdir: './dist/bundle',
  },
});
