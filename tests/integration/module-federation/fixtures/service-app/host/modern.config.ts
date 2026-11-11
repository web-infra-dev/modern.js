import { appTools, defineConfig } from '@modern-js/app-tools';
import { origin, port } from '../ports';
const csr = process.env.MF_LAB_HOST_MODE === 'csr';
const name = csr ? 'serviceCSR' : 'serviceSSR';
export default defineConfig({
  server: {
    port: port(name, 0),
    ssr: csr ? false : { mode: 'stream', forceCSR: true },
  },
  output: { assetPrefix: origin(name, 0) + '/' },
  dev: { assetPrefix: origin(name, 0) + '/', lazyCompilation: false },
  performance: { buildCache: false },
  moduleFederation: {
    services: {
      'provider/ServiceWeatherApplication': {
        timeoutMs: 15000,
        forwardHeaders: ['accept-language'],
        serviceHeaders: { 'x-weather-service-key': 'local-service-test-key' },
      },
    },
  },
  plugins: [appTools()],
});
