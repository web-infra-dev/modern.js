import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: false,
    outdir: './dist/false-bundleless',
  },
});
