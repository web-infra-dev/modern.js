import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    sideEffects: false,
    style: {
      inject: true,
    },
    input: ['index.ts'],
  },
});
