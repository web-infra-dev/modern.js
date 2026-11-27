import { appTools, defineConfig } from '@modern-js/app-tools';
import { origin, port } from '../ports';

export default defineConfig({
  html: {
    title: 'Dynamic Consumer · Weather Lab',
    meta: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
  },
  server: {
    port: port('consumer', 4308),
    ssr: { mode: 'stream', forceCSR: true },
  },
  output: {
    assetPrefix: `${origin('consumer', 4308)}/`,
  },
  dev: {
    assetPrefix: `${origin('consumer', 4308)}/`,
    lazyCompilation: false,
  },
  source: {
    globalVars: {
      'process.env.MF_LAB_API': origin('api', 4306),
      'process.env.MF_LAB_ORIGIN': origin('host', 4300),
      'process.env.MF_LAB_CONSUMER': origin('consumer', 4308),
    },
  },
  performance: { buildCache: false },
  moduleFederation: {
    name: 'lab_dynamic_consumer',
    applications: {
      hooks: './src/applications.ts',
      autoGenerateRoute: true,
    },
  },
  plugins: [appTools()],
});
