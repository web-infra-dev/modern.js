import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    path: './dist/bundle',
  },
});
