import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    asset: {
      path: './asset',
      name: 'b.png',
    },
    path: './dist/string/bundleless',
  },
});
