import { URL } from 'url';
import { logger } from '@modern-js/builder-shared';
import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';

const { DEPLOY_HOST = 'https://modernjs.dev' } = process.env;
const assetPrefix = new URL('/devtools', DEPLOY_HOST).href;
logger.info(`Use asset prefix:`, assetPrefix);

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: '/devtools',
    },
  },
  dev: {
    port: 8780,
    assetPrefix,
    proxy: { [assetPrefix]: 'http://localhost:8780/devtools' },
  },
  source: {
    preEntry: [require.resolve('modern-normalize/modern-normalize.css')],
    globalVars: {
      'process.env.PKG_VERSION': require('./package.json').version,
    },
  },
  output: {
    assetPrefix,
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
