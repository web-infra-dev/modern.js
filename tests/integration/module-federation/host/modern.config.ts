import { weatherMetricsScript } from './metrics';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { port, origin } from '../ports';
const name = 'host';
export default defineConfig({
  html: {
    title: 'Federation lab · SSR & data fetching',
    tags: [
      {
        tag: 'script',
        children: weatherMetricsScript,
        head: true,
        append: false,
      },
    ],
  },
  server: {
    port: port('hostInternal', 4307),
    ssr: { mode: 'stream', forceCSR: true },
  },
  output: {
    distPath: {
      root: process.env.MF_LAB_VERSION === 'v2' ? 'dist-v2' : 'dist',
    },
    assetPrefix: `${origin(name, 4300)}/`,
  },
  dev: { assetPrefix: `${origin(name, 4300)}/`, lazyCompilation: false },
  source: {
    globalVars: {
      'process.env.MF_LAB_ORIGIN': origin('host', 4300),
      'process.env.MF_LAB_API': origin('api', 4306),
      'process.env.MF_LAB_NESTED': origin('nested', 4302),
      'process.env.MF_LAB_LIBRARY': origin('library', 4303),
      'process.env.MF_LAB_LIBRARY_V2': origin('libraryV2', 4305),
      'process.env.MF_LAB_PROVIDER_V2': origin('providerV2', 4304),
    },
  },
  performance: { buildCache: false },
  moduleFederation: { fetchServerQuery: { lab: 'federation' } },
  plugins: [appTools()],
});
