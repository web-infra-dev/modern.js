import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundleless',
      asset: {
        name: () => 'b.png',
      },
    },
    {
      buildType: 'bundleless',
      asset: {
        name: '[name].[ext]',
      },
    },
  ],
});
