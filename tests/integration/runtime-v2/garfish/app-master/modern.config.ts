import { appTools, defineConfig } from '@modern-js/app-tools-v2';
import { runtimePlugin } from '@modern-js/runtime-v2/cli';
import { garfishPlugin } from '@modern-js/plugin-garfish-v2/cli';

export default defineConfig({
  plugins: [
    appTools({
      bundler:
        process.env.BUNDLER === 'webpack' ? 'webpack' : 'experimental-rspack',
    }),
    runtimePlugin(),
    garfishPlugin(),
  ],
});
