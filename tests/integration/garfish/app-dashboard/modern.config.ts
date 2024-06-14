import { appTools, defineConfig } from '@modern-js/app-tools';
import { garfishPlugin } from '@modern-js/plugin-garfish/cli';

export default defineConfig({
  dev: {
    port: 8082,
  },
  runtime: {
    router: true,
  },
  deploy: {
    microFrontend: true,
  },
  plugins: [
    appTools({
      bundler:
        process.env.BUNDLER === 'webpack' ? 'webpack' : 'experimental-rspack',
    }),
    garfishPlugin(),
  ],
});
