import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

export default defineConfig({
  server: { port: 4601, ssr: { mode: 'stream', forceCSR: true } },
  output: { assetPrefix: 'http://127.0.0.1:4601/' },
  source: {
    globalVars: { 'process.env.COMMERCE_API_ORIGIN': 'http://127.0.0.1:4600' },
  },
  plugins: [
    appTools(),
    moduleFederationPlugin({
      bridge: { exposes: { './App': true } },
      config: { name: 'commerce_products', dts: false },
    }),
  ],
});
