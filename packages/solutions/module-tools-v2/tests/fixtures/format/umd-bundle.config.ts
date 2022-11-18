import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'umd',
    path: './dist/bundle',
  },
});
