import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'iife',
    path: './dist/bundle',
  },
});
