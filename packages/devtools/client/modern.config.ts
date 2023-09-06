import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';

const ONLINE_DOMAIN = 'modernjs.dev';
const ONLINE_BASENAME = '/devtools';
const ONLINE_URL = ONLINE_DOMAIN + ONLINE_BASENAME;

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: ONLINE_BASENAME,
    },
  },
  dev: {
    port: 8780,
    assetPrefix: ONLINE_BASENAME,
    proxy: {
      [`$${ONLINE_URL}`]: 'http://localhost:8780',
      [`^${ONLINE_URL}/**`]: 'http://localhost:8780/devtools/$1',
    },
  },
  source: {
    preEntry: [
      './src/preludes/gh-page-loader.js',
      require.resolve('modern-normalize/modern-normalize.css'),
    ],
    globalVars: {
      'process.env.PKG_VERSION': require('./package.json').version,
    },
  },
  output: {
    enableCssModuleTSDeclaration: true,
  },
  tools: {
    htmlPlugin: {
      filename: 'index.html',
    },
    devServer: {
      client: {
        host: 'localhost',
        protocol: 'ws',
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
