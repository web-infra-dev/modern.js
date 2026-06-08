import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

export default defineConfig({
  server: {
    port: 4341,
  },
  source: {
    entries: {
      'creative-hub': {
        entry: './src/garfish/CreativeHubEntry.tsx',
        customEntry: true,
      },
    },
  },
  performance: {
    buildCache: false,
  },
  plugins: [appTools(), moduleFederationPlugin()],
});
