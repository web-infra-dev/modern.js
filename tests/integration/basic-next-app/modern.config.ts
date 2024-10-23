import { applyBaseConfig } from '../../utils/applyBaseConfig';
import path from 'path';
import { WebpackRscServerPlugin } from './plugins/rsc-server-plugin';
import { WebpackRscClientPlugin } from './plugins/rsc-client-plugin';
import { RsdoctorWebpackPlugin } from '@rsdoctor/webpack-plugin';

const clientReferencesMap = new Map();
const serverReferencesMap = new Map();

const webpackRscLayerName = `react-server`;

const rscServerLoaderPath = path.join(
  __dirname,
  'plugins/rsc-server-loader.ts',
);

const rscSsrLoaderPath = path.join(__dirname, 'plugins/rsc-ssr-loader.ts');

const rscClientLoaderPath = path.join(
  path.dirname(require.resolve('@mfng/webpack-rsc')),
  '/webpack-rsc-client-loader.cjs',
);

const styles = new Set<string>();

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
    webpack(config, { appendPlugins }) {
      if (process.env.RSDOCTOR) {
        appendPlugins(
          new RsdoctorWebpackPlugin({
            features: {
              loader: true,
            },
          }),
        );
      }
    },

    bundlerChain(chain, { isServer }) {
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
        const babelLoaderPath = require.resolve('babel-loader', {
          paths: [
            require.resolve('@modern-js/uni-builder', {
              paths: [require.resolve('@modern-js/app-tools')],
            }),
          ],
        });
        const babelOptions = babelUse.get('options');

        chain.module.rules.delete('js');

        chain.module
          .rule('js')
          .test(/\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/)
          .oneOf('rsc-server')
          .exclude.add(/node_modules/)
          .end()
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
          .exclude.add(/node_modules/)
          .end()
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
          .end();

        chain.module
          .rule('server-module')
          .resource([/\/framework\/rsc-runtime/, /\/framework\/ServerRoot/])
          .layer(webpackRscLayerName)
          .end();

        chain
          .plugin('rsc-server-plugin')
          .use(WebpackRscServerPlugin, [
            { clientReferencesMap, serverReferencesMap, styles },
          ]);

        chain.module
          .rule('react-server')
          .issuerLayer(webpackRscLayerName)
          .resolve.conditionNames.merge(['react-server', '...']);

        chain.module.rule('css').uses.delete('ignore-css');
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
          .use(WebpackRscClientPlugin, [{ clientReferencesMap, styles }]);
      }
    },
  },
});
