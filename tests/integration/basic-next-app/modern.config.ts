import path from 'path';
import {
  RscClientPlugin as WebpackRscClientPlugin,
  RscServerPlugin as WebpackRscServerPlugin,
} from '@modern-js/uni-builder/rsc';
import { RsdoctorWebpackPlugin } from '@rsdoctor/webpack-plugin';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

const appToolsPath = require.resolve('@modern-js/app-tools');
const uniBuilderRscPath = require.resolve('@modern-js/uni-builder/rsc', {
  paths: [appToolsPath],
});

const rscClientLoaderPath = path.join(
  path.dirname(uniBuilderRscPath),
  'rsc-client-loader',
);

const rscServerLoaderPath = path.join(
  path.dirname(uniBuilderRscPath),
  'rsc-server-loader',
);

const rscSsrLoaderPath = path.join(
  path.dirname(uniBuilderRscPath),
  'rsc-ssr-loader',
);

const rscCssLoaderPath = path.join(
  path.dirname(uniBuilderRscPath),
  'rsc-css-loader',
);

const clientReferencesMap = new Map();
const serverReferencesMap = new Map();

const webpackRscLayerName = `react-server`;

const styles = new Set<string>();

const CSS_RULE_NAMES = ['less', 'css', 'scss', 'sass'];

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
    minify: false,
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
      // config.optimization.concatenateModules = false;
      // delete config.cache;
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

        const entryPath2Name = new Map<string, string>();

        for (const [name, entry] of Object.entries(
          chain.entryPoints.entries(),
        )) {
          entry.values().forEach(value => {
            entryPath2Name.set(value as unknown as string, name);
          });
        }
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

        // babel-loader 待在前面，保证 ts 和 tsx 被编译了
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
            entryPath2Name,
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
          .use(WebpackRscServerPlugin, [{ styles }]);

        chain.module
          .rule('react-server')
          .issuerLayer(webpackRscLayerName)
          .resolve.conditionNames.merge(['react-server', '...']);

        CSS_RULE_NAMES.forEach(ruleName => {
          const rule = chain.module.rules.get(ruleName);
          if (rule) {
            chain.module
              .rule(ruleName)
              .use('custom-loader')
              .before('ignore-css')
              .loader(rscCssLoaderPath);
          }
        });

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
            callServerImport: path.resolve(
              __dirname,
              'src/framework/client-entry',
            ),
          })
          .before('babel')
          .end();

        chain
          .plugin('rsc-client-plugin')
          .use(WebpackRscClientPlugin, [{ styles }]);
      }
    },
  },
});
