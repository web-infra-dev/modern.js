import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      input: ['style.css'],
      outDir: 'dist/design-system',
    },
  ],
  designSystem: {
    extend: {
      black: 'white',
    },
  },
});
