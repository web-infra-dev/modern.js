import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js';

export default defineConfig({
  server: {
    port: 3011,
  },
  output: {
    polyfill: 'off',
    disableTsChecker: true,
    minify: false,
  },
  performance: {
    buildCache: false,
  },
  plugins: [appTools(), moduleFederationPlugin()],
});

