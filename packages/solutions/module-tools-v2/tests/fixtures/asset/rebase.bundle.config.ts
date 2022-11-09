import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      path: './asset',
      rebase: false,
      publicPath: 'xxx://yyy',
    },
    path: './dist/bundle',
  },
});
