import { applyBaseConfig } from '../../utils/applyBaseConfig';
// import ReactServerWebpackPlugin from 'react-server-dom-webpack/plugin';
import { ReactFlightClientWebpackPlugin } from './plugins/ReactFlightWebpackPlugin';
import path from 'path';
import {
  WebpackRscClientPlugin,
  WebpackRscServerPlugin,
  createWebpackRscClientLoader,
  createWebpackRscServerLoader,
  createWebpackRscSsrLoader,
} from '@mfng/webpack-rsc';

/**
 * @type {import('@mfng/webpack-rsc').ClientReferencesMap}
 */
const clientReferencesMap = new Map();
const serverReferencesMap = new Map();

const webpackRscLayerName = `react-server`;

const rscServerLoaderPath = path.join(
  __dirname,
  'plugins/webpack-rsc-server-loader.js',
);

const rscSsrLoaderPath = path.join(
  path.dirname(require.resolve('@mfng/webpack-rsc')),
  '/webpack-rsc-ssr-loader.cjs',
);

const rscClientLoaderPath = path.join(
  path.dirname(require.resolve('@mfng/webpack-rsc')),
  '/webpack-rsc-client-loader.cjs',
);

export default applyBaseConfig({
  runtime: {
    state: false,
    router: false,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  source: {
    enableCustomEntry: true,
  },
  output: {
    externals: {
      pg: 'pg',
    },
  },
  tools: {
    babel(config, { modifyPresetReactOptions }) {
      modifyPresetReactOptions({
        runtime: 'automatic',
      });
    },

    bundlerChain(chain, { isServer }) {
      chain.cache(false);
      if (isServer) {
        chain.name('server');
        chain.entryPoints.clear();
        chain.entry('main').add({
          import: [path.resolve(__dirname, './src/index.server.tsx')],
        });

        chain.experiments({
          ...chain.experiments,
          layers: true,
        });

        const jsRule = chain.module.rule('js');
        const babelUse = jsRule.use('babel');
        const babelLoaderPath =
          '/Users/bytedance/Desktop/workspace/modern-js-main.js/node_modules/.pnpm/babel-loader@9.1.3_@babel+core@7.24.7_webpack@5.93.0/node_modules/babel-loader/lib/index.js';
        const babelOptions = babelUse.get('options');

        chain.module.rules.delete('js');

        chain.module
          .rule('js')
          .test(/\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/)
          .oneOf('rsc-server')
          .issuerLayer(webpackRscLayerName)
          .use('rsc-server-loader')
          .loader(rscServerLoaderPath)
          .options({
            clientReferencesMap,
            serverReferencesMap,
          })
          .end()
          .use('babel')
          .loader(babelLoaderPath)
          .options(babelOptions)
          .end()
          .end()
          .oneOf('rsc-ssr')
          .use('rsc-ssr-loader')
          .loader(rscSsrLoaderPath)
          .options({
            serverReferencesMap,
          })
          .end()
          .use('babel')
          .loader(babelLoaderPath)
          .options(babelOptions)
          .end()
          .end()
          .oneOf('general-js')
          .end()
          .use('babel')
          .loader(babelLoaderPath)
          .options(babelOptions)
          .end()
          .end();

        chain.module
          .rule('server-module')
          .resource([
            /\/framework\/rsc-runtime/,
            /\/framework\/ServerRoot/,
            // /src\/components\/App/,
          ])
          .layer(webpackRscLayerName)
          .end();

        chain.module
          .rule('react-server')
          .set('issuerLayer', webpackRscLayerName)
          .resolve.set('conditionNames', ['react-server', '...'])
          .end();

        chain
          .plugin('rsc-server-plugin')
          .use(WebpackRscServerPlugin, [
            { clientReferencesMap, serverReferencesMap },
          ]);

        chain.module
          .rule('react-server')
          .issuerLayer(webpackRscLayerName)
          .resolve.conditionNames.merge(['react-server', '...']);
      } else {
        chain.name('client');
        chain.dependencies(['server']);

        // html-webpack-plugin 的 compilcation 会用 clientReference，但其实找不到 template，所以先删掉
        chain.plugins.delete('html-main');
        chain.plugins.delete('rsbuild-html-plugin');
        chain.plugins.delete('html-async-chunk');

        chain.module
          .rule('js')
          .use('rsc-client-loader')
          .loader(rscClientLoaderPath)
          .options({
            serverReferencesMap,
            callServerImportSource: path.resolve(
              __dirname,
              'src/framework/client-entry',
            ),
          })
          .before('babel')
          .end();

        chain
          .plugin('rsc-client-plugin')
          .use(WebpackRscClientPlugin, [{ clientReferencesMap }]);
      }
    },
  },
});
