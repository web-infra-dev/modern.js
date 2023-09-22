import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    tsconfig: 'tsconfig-test.json',
    buildType: 'bundle',
    input: ['src/index.ts'],
  },
});
