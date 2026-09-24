import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

export default defineConfig({
  server: { port: 4500, ssr: { mode: 'stream', forceCSR: true } },
  output: { assetPrefix: 'http://127.0.0.1:4500/' },
  source: {
    globalVars: { 'process.env.COMMERCE_API_ORIGIN': 'http://127.0.0.1:4500' },
  },
  plugins: [
    appTools(),
    moduleFederationPlugin({
      bridge: true,
      config: {
        name: 'commerce_host',
        remotes: {
          products: 'commerce_products@http://127.0.0.1:4501/mf-manifest.json',
          inventory:
            'commerce_inventory@http://127.0.0.1:4502/mf-manifest.json',
        },
        dts: false,
      },
    }),
  ],
});
