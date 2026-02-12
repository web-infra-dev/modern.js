import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

const remotePort = process.env.RSC_MF_REMOTE_PORT || process.env.PORT || '3008';

export default defineConfig({
  server: {
    ssr: {
      mode: 'stream',
    },
    rsc: true,
  },
  output: {
    polyfill: 'off',
    disableTsChecker: true,
    assetPrefix: `http://127.0.0.1:${remotePort}`,
  },
  performance: {
    buildCache: false,
  },
  tools: {
    bundlerChain(chain) {
      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
  plugins: [appTools(), moduleFederationPlugin()],
});
