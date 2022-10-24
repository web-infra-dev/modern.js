import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      path: './asset',
      rebase: true,
      publicPath: 'xxx://yyy',
    },
    path: './dist/bundle',
  },
});
