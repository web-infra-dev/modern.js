import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    dts: false,
    outdir: './dist/false-bundle',
  },
});
