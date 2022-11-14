import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    dts: {
      only: true,
    },
    path: './dist/only-bundleless',
  },
});
