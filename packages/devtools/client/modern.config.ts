import { URL } from 'url';
import path from 'path/posix';
import { execSync } from 'child_process';
import { logger } from '@modern-js/builder-shared';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';
import { withQuery } from 'ufo';

let version = '';
if (process.env.BASENAME === 'version' || !process.env.BASENAME) {
  ({ version } = require('./package.json'));
} else if (process.env.BASENAME === 'commit') {
  version = execSync('git rev-parse --short HEAD').toString().trim();
  if (!version.match(/^\w{11}$/)) {
    throw new Error("Can't resolve git commit hash.");
  }
} else if (process.env.BASENAME === 'false') {
  version = '';
} else {
  version = process.env.BASENAME;
}

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
