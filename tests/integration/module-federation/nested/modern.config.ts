import { appTools, defineConfig } from '@modern-js/app-tools';
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
  performance: { buildCache: false },
  plugins: [appTools()],
});
