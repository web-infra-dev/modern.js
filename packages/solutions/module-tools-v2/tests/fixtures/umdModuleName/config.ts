import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'umd',
      umdModuleName: () => 'Demo',
      outdir: './dist',
    },
  ],
});
