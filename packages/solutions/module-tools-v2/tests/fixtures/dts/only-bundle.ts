import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: {
      only: true,
    },
    path: './dist/only-bundle',
  },
});
