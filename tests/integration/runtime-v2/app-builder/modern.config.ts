import { appTools, defineConfig } from '@modern-js/app-tools-v2';

export default defineConfig({
  plugins: [
    appTools({
      bundler:
        process.env.BUNDLER === 'webpack' ? 'webpack' : 'experimental-rspack',
    }),
  ],
});
