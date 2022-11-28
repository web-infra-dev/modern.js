import { defineConfig } from '@modern-js/module-tools';

// https://modernjs.dev/docs/apis/module/config
export default defineConfig({
  testing: {
    transformer: 'ts-jest',
  },
  output: {
    buildConfig: {
      format: 'esm',
      enableDts: true,
    },
  },
});
