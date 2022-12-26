import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'umd',
      umdGlobals: {
        react: 'React',
      },

      outDir: './dist/umd',
    },
    {
      buildType: 'bundle',
      format: 'iife',
      umdGlobals: {
        react: 'React',
      },

      outDir: './dist/iife',
    },
  ],
});
