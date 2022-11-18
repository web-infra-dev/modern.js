import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: false,
    path: './dist/false-bundle',
  },
});
