import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    asset: {
      path: './asset',
      name: str => `test-${str}`,
    },
    path: './dist/func/bundleless',
  },
});
