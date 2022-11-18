import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    jsx: 'transform',
    path: './dist/transform/bundleless',
  },
});
