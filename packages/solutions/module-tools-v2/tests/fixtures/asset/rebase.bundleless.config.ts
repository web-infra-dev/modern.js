import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    asset: {
      path: './asset',
      rebase: false,
      publicPath: 'xxx://yyy',
    },
    path: './dist/bundleless',
  },
});
