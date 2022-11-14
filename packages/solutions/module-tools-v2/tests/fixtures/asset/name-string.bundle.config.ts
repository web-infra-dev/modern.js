import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    asset: {
      path: './asset',
      name: 'b.png',
    },
    path: './dist/string/bundle',
  },
});
