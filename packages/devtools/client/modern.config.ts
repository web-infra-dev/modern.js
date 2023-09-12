import { URL } from 'url';
import path from 'path/posix';
import { logger } from '@modern-js/builder-shared';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';
import { withQuery } from 'ufo';

const { version } = require('./package.json');

const { DEPLOY_HOST = 'https://modernjs.dev' } = process.env;
const assetPrefix = path.resolve('/devtools', version);
const basename = new URL(assetPrefix, DEPLOY_HOST).href;
logger.info(`Use application basename:`, basename);
logger.info(
  `Access with local RPC:`,
  withQuery(basename, { src: 'ws://localhost:8080/_modern_js/devtools/rpc' }),
);

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: assetPrefix,
    },
  },
  dev: {
    port: 8780,
    assetPrefix,
    proxy: {
      [basename]: new URL(assetPrefix, 'http://localhost:8780').href,
    },
  },
  source: {
    preEntry: [require.resolve('modern-normalize/modern-normalize.css')],
    globalVars: {
      'process.env.PKG_VERSION': version,
    },
  },
  output: {
    assetPrefix: basename,
    enableCssModuleTSDeclaration: true,
  },
  tools: {
    devServer: {
      client: {
        host: 'localhost',
        protocol: 'ws',
      },
    },
  },
  html: {},
  plugins: [
    appTools({
      bundler: 'experimental-rspack',
    }),
    proxyPlugin(),
  ],
});
