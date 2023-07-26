import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  designSystem: {
    extend: {
      black: 'white',
    },
  },
  buildConfig: {
    outDir: './dist/bundle',
    buildType: 'bundle',
    input: ['./src/index.css'],
  },
});
