import { defineConfig } from '@modern-js/module-tools';

// https://modernjs.dev/docs/apis/module/config
export default defineConfig({
  testing: {
    transformer: 'ts-jest',
  },
  output: {
    buildConfig: {
      buildType: 'bundle',
      enableDts: true,
      format: 'esm',
    },
  },
});
