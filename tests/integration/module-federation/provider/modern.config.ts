import { appTools, defineConfig } from '@modern-js/app-tools';
import { port, origin } from '../ports';
const name = process.env.MF_LAB_VERSION === 'v2' ? 'providerV2' : 'provider';
export default defineConfig({
  html: { title: 'Federation lab · SSR & data fetching' },
  server: {
    port: port(name, 4301),
    ssr: process.env.MF_LAB_VERSION === 'v2' ? false : { mode: 'stream' },
  },
  output: {
    dataUriLimit: 0,
    distPath: {
      root: process.env.MF_LAB_VERSION === 'v2' ? 'dist-v2' : 'dist',
    },
    assetPrefix: `${origin(name, 4301)}/`,
  },
  dev: { assetPrefix: `${origin(name, 4301)}/`, lazyCompilation: false },
  source: {
    globalVars: {
      'process.env.MF_LAB_API': origin('api', 4306),
      'process.env.MF_LAB_VERSION': process.env.MF_LAB_VERSION || 'v1',
    },
  },
  tools: {
    svgr: false,
    rspack: {
      output: {
        uniqueName: `mf-lab-provider-${process.env.MF_LAB_VERSION || 'v1'}`,
        chunkLoadingGlobal: `mf_lab_provider_${process.env.MF_LAB_VERSION || 'v1'}`,
      },
    },
  },
  performance: { buildCache: false },
  plugins: [appTools()],
});
