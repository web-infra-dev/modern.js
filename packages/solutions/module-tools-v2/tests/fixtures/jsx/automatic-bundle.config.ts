import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    jsx: 'automatic',
    path: './dist/automatic/bundle',
  },
});
