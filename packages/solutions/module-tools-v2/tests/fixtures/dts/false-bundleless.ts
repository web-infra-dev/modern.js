import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: false,
    path: './dist/false-bundleless',
  },
});
