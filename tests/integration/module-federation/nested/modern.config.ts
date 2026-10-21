import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';
import { port, origin } from '../ports';
const name = 'nested';
export default defineConfig({
  html: { title: 'Federation lab · SSR & data fetching' },
  server: { port: port(name, 4302), ssr: { mode: 'stream' } },
  output: {
    distPath: {
      root: process.env.MF_LAB_VERSION === 'v2' ? 'dist-v2' : 'dist',
    },
    assetPrefix: `${origin(name, 4302)}/`,
  },
  dev: { assetPrefix: `${origin(name, 4302)}/`, lazyCompilation: false },
  source: {
    globalVars: {
      'process.env.MF_LAB_ORIGIN': origin('host', 4300),
      'process.env.MF_LAB_LIBRARY': origin('library', 4303),
      'process.env.MF_LAB_LIBRARY_V2': origin('libraryV2', 4305),
      'process.env.MF_LAB_PROVIDER_V2': origin('providerV2', 4304),
    },
  },
  resolve: {
    alias: {
      '@module-federation/runtime$':
        require.resolve('@module-federation/runtime'),
    },
  },
  performance: { buildCache: false },
  plugins: [appTools(), moduleFederationPlugin()],
});
