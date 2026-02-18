import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const remotePort = process.env.RSC_MF_REMOTE_PORT || process.env.PORT || '3008';

export default defineConfig({
  server: {
    rsc: true,
    ssr: true,
    port: Number(remotePort),
  },
  // Keep RSC server entries synchronous for MF+RSC handlers.
  source: {
    enableAsyncEntry: false,
  },
  output: {
    polyfill: 'off',
    disableTsChecker: true,
    assetPrefix: `http://127.0.0.1:${remotePort}`,
  },
  performance: {
    buildCache: false,
  },
  plugins: [appTools(), moduleFederationPlugin({ ssr: true })],
});
