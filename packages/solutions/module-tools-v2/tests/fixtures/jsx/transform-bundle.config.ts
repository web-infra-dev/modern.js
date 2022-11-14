import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'transform',
    path: './dist/transform/bundle',
  },
});
