import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  designSystem: {
    extend: {
      black: 'white',
    },
  },
  buildConfig: {
    outdir: './dist/bundle',
    buildType: 'bundle',
    input: ['./src/index.css'],
  },
});
