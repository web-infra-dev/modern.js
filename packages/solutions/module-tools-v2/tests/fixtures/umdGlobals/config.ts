import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'umd',
      umdGlobals: {
        react: 'React',
      },

      outdir: './dist/umd',
    },
    {
      buildType: 'bundle',
      format: 'iife',
      umdGlobals: {
        react: 'React',
      },

      outdir: './dist/iife',
    },
  ],
});
