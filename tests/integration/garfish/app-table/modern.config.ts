import { appTools, defineConfig } from '@modern-js/app-tools';
import { garfishPlugin } from '@modern-js/plugin-garfish/cli';

export default defineConfig({
  source: {
    enableCustomEntry: true,
  },
  dev: {
    port: 8081,
  },
  runtime: {
    router: true,
  },
  deploy: {
    microFrontend: true,
  },
  plugins: [
    appTools({
      bundler: process.env.BUNDLER === 'webpack' ? 'webpack' : 'rspack',
    }),
    garfishPlugin(),
  ],
});
