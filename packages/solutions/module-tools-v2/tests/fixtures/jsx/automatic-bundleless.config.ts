import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    jsx: 'automatic',
    path: './dist/automatic/bundleless',
  },
});
