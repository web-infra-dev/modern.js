import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';
import { parseURL, resolveURL, stringifyParsedURL } from 'ufo';

const isProduction = process.env.NODE_ENV === 'production';
const url = parseURL(process.env.ASSET_PREFIX ?? '/devtools');
url.protocol ||= 'https:';
url.host ||= 'modernjs.dev';
const ASSET_PREFIX = stringifyParsedURL(url);
console.log('ASSET_PREFIX: ', ASSET_PREFIX);

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: url.pathname,
    },
  },
  dev: {
    port: 8780,
    assetPrefix: ASSET_PREFIX,
    proxy: {
      [`${ASSET_PREFIX}/static`]: resolveURL(
        'http://localhost:8780',
        url.pathname,
        'static',
      ),
      [ASSET_PREFIX]: 'http://localhost:8780',
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
    assetPrefix: ASSET_PREFIX,
    enableCssModuleTSDeclaration: true,
  },
  tools: {
    htmlPlugin(opts) {
      if (isProduction) {
        return { ...opts, filename: 'index.html' };
      } else {
        return opts;
      }
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
