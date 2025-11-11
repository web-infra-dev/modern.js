import path from 'path';
import { moduleFederationPlugin } from '@module-federation/modern-js-rsc';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

const resolvedPort = process.env.PORT ? Number(process.env.PORT) : undefined;
const assetPrefix = process.env.ASSET_PREFIX;

const devConfig = resolvedPort ? { port: resolvedPort } : {};

const serverConfig = {
  ssr: {
    mode: 'stream',
    // Force CSR in dev so initial health check to '/' succeeds before SSR
    // bundles are warmed; server actions still route via x-rsc-action.
    forceCSR: process.env.NODE_ENV !== 'production',
  },
  rsc: true,
  ...(resolvedPort ? { port: resolvedPort } : {}),
};

const outputConfig: Record<string, string> = {};
if (assetPrefix) {
  outputConfig.assetPrefix = assetPrefix;
}

export default applyBaseConfig({
  dev: devConfig,
  server: serverConfig,
  output: outputConfig,
  runtime: {
    router: false,
    state: false,
  },
  source: {
    enableAsyncEntry: false,
    entries: {
      main: 'src/App.tsx',
    },
    disableDefaultEntries: true,
  },
  plugins: [
    moduleFederationPlugin({
      remoteIpStrategy: 'inherit',
    }),
  ],
  tools: {
    devServer: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    },
  },
  tools: {
    bundlerChain(chain) {
      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
});
