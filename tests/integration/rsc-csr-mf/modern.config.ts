import path from 'path';
import { moduleFederationPlugin } from '@module-federation/modern-js-rsc';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

const resolvedPort = process.env.PORT ? Number(process.env.PORT) : undefined;
const assetPrefix = process.env.ASSET_PREFIX;

const devConfig = resolvedPort ? { port: resolvedPort } : {};
const serverConfig = {
  ssr: {
    mode: 'stream',
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
      server: 'src/server-entry.ts',
    },
    disableDefaultEntries: true,
  },
  plugins: [moduleFederationPlugin()],
  tools: {
    bundlerChain(chain, { isServer }) {
      chain.resolve.modules
        .clear()
        .add(path.resolve(__dirname, 'node_modules'))
        .add('node_modules');
    },
  },
});
