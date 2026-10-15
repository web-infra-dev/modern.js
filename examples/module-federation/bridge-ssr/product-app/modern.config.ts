import { appTools, defineConfig } from '@modern-js/app-tools';
import { moduleFederationPlugin } from '@module-federation/modern-js-v3';

export default defineConfig({
  server: { port: 4901, ssr: { mode: 'stream', forceCSR: true } },
  output: { assetPrefix: 'http://127.0.0.1:4901/' },
  source: {
    globalVars: { 'process.env.COMMERCE_API_ORIGIN': 'http://127.0.0.1:4900' },
  },
  plugins: [
    appTools(),
    moduleFederationPlugin({
      bridge: true,
      config: {
        name: 'commerce_products',
        exposes: { './App': './src/bridge.tsx' },
        dts: false,
      },
    }),
  ],
});
