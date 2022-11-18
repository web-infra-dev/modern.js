import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'cjs',
    path: './dist/bundleless',
  },
});
