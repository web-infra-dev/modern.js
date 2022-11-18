import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'esm',
    path: './dist/bundleless',
  },
});
