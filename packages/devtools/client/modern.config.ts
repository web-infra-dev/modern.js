import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: true,
  },
  dev: {
    port: 8780,
    assetPrefix: '/devtools',
    proxy: {
      'https://modernjs.dev/devtools': 'https://localhost:8780/devtools',
    },
    https: true,
  },
  tools: {
    devServer: {
      client: {
        host: 'localhost',
      },
    },
  },
  plugins: [
    appTools({
      bundler: 'experimental-rspack',
    }),
    proxyPlugin(),
  ],
});
