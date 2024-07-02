import { appTools, defineConfig } from '@modern-js/app-tools';
import { garfishPlugin } from '@modern-js/plugin-garfish/cli';

export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler:
        process.env.BUNDLER === 'webpack' ? 'webpack' : 'experimental-rspack',
    }),
    garfishPlugin(),
  ],
});
