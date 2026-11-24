import path from 'node:path';
import { weatherMetricsScript } from './metrics';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { port, origin } from '../ports';
import { updateRequestPolicy } from '../update-lab';
const name = 'host';
const partial = process.env.MF_LAB_SSR_SCOPE === 'entries';
export default defineConfig({
  html: {
    title: 'Weather Lab · Module Federation',
    meta: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
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
    tsconfigPath: './tsconfig.server.json',
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
    ...(partial
      ? {
          disableDefaultEntries: true,
          entries: {
            index: 'src/entries/update-shell/routes',
            weather: 'src/entries/update-weather/routes',
          },
        }
      : {}),
    globalVars: {
      'process.env.MF_LAB_SOURCE_ROOT':
        process.env.MF_LAB_SOURCE_ROOT || path.resolve(__dirname, '..'),
      'process.env.MF_LAB_UPDATES': process.env.MF_LAB_UPDATES || '',
      'process.env.MF_LAB_SSR_SCOPE': process.env.MF_LAB_SSR_SCOPE || '',
      'process.env.MF_LAB_SERVICE': process.env.MF_LAB_SERVICE || '',
      'process.env.MF_LAB_SERVICE_NESTED':
        process.env.MF_LAB_SERVICE_NESTED ||
        (process.env.MF_LAB_UPDATES === 'all' ? '1' : ''),
      'process.env.MF_LAB_DEV_ORIGIN': process.env.MF_LAB_DEV_ORIGIN || '',
      'process.env.MF_LAB_DEV_PARTIAL_ORIGIN':
        process.env.MF_LAB_DEV_PARTIAL_ORIGIN || '',
      'process.env.MF_LAB_UPDATE_ORIGIN':
        process.env.MF_LAB_UPDATE_ORIGIN || '',
      'process.env.MF_LAB_PARTIAL_ORIGIN':
        process.env.MF_LAB_PARTIAL_ORIGIN || '',
      'process.env.MF_LAB_ORIGIN': origin('host', 4300),
      'process.env.MF_LAB_API': origin('api', 4306),
      'process.env.MF_LAB_LIBRARY': origin('library', 4303),
      'process.env.MF_LAB_LIBRARY_V2': origin('libraryV2', 4305),
      'process.env.MF_LAB_PROVIDER_V2': origin('providerV2', 4304),
    },
  },
  performance: { buildCache: false },
  moduleFederation: {
    fetchServerQuery: { lab: 'federation' },
    ...(process.env.MF_LAB_UPDATES
      ? {
          ssr: {
            cacheUpdates: true,
            application: {
              requestPolicy: updateRequestPolicy,
            },
          },
        }
      : {}),
    ...(['service', 'all'].includes(process.env.MF_LAB_UPDATES || '') ||
    process.env.MF_LAB_SERVICE_NESTED
      ? {
          services: {
            'provider/ServiceWeatherApplication': {
              timeoutMs: 15000,
              forwardHeaders: ['accept-language', 'x-lab-update-policy'],
              serviceHeaders: {
                'x-weather-service-key': 'local-service-test-key',
              },
            },
          },
        }
      : {}),
  },
  plugins: [appTools()],
});
