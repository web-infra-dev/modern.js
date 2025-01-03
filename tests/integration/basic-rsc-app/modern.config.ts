import path from 'path';
import {
  RscClientPlugin as WebpackRscClientPlugin,
  RscServerPlugin as WebpackRscServerPlugin,
} from '@modern-js/uni-builder/rsc';
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
    rsc: true,
  },
  // deploy: {
  //   worker: {
  //     ssr: true,
  //   },
  // },
  output: {
    minify: false,
  },
  // source: {
  //   enableCustomEntry: false,
  // },
  tools: {
    rspack(config, { isServer }) {
      if (!config.output) {
        config.output = {};
      }
      if (!isServer) {
        config.output.chunkFilename = 'static/js/async/[name].[contenthash].js';
      }
    },
    // babel(config, { modifyPresetReactOptions }) {
    //   modifyPresetReactOptions({
    //     runtime: 'automatic',
    //   });
    // },
    // webpack(config, { isServer }) {
    //   if (!isServer) {
    //     config.optimization = {
    //       ...config.optimization,
    //       runtimeChunk: {
    //         name: entrypoint => `runtime-${entrypoint.name}`, // 为每个入口点生成独立的 runtime chunk
    //       },
    //     };
    //   }
    // },
    // bundlerChain(chain, { isServer }) {
    //   if (isServer) {
    //     chain.name('server');
    //     chain.experiments({
    //       ...chain.experiments,
    //       layers: true,
    //     });
    //     // const jsRule = chain.module.rule('js');
    //     // const babelUse = jsRule.use('babel');
    //     // const babelLoaderPath = require.resolve('babel-loader', {
    //     //   paths: [
    //     //     require.resolve('@modern-js/uni-builder', {
    //     //       paths: [require.resolve('@modern-js/app-tools')],
    //     //     }),
    //     //   ],
    //     // });
    //     // const babelOptions = babelUse.get('options');
    //     // chain.module.rules.delete('js');
    //     // chain.module
    //     //   .rule('js')
    //     //   .test(/\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/)
    //     //   .oneOf('rsc-server')
    //     //   .issuerLayer(webpackRscLayerName)
    //     //   .use('rsc-server-loader')
    //     //   .loader(rscServerLoaderPath)
    //     //   .options({
    //     //     runtimeExport: '@modern-js/render/rsc',
    //     //   })
    //     //   .end()
    //     //   .use('babel')
    //     //   .loader(babelLoaderPath)
    //     //   .options({
    //     //     ...babelOptions,
    //     //     exclude: /node_modules\/(?!\.modern-js)/,
    //     //   })
    //     //   .end()
    //     //   .end()
    //     //   .oneOf('rsc-ssr')
    //     //   .use('rsc-ssr-loader')
    //     //   .loader(rscSsrLoaderPath)
    //     //   .options({
    //     //     serverReferencesMap,
    //     //   })
    //     //   .end()
    //     //   .use('babel')
    //     //   .loader(babelLoaderPath)
    //     //   .options({
    //     //     ...babelOptions,
    //     //     exclude: /node_modules\/(?!\.modern-js)/,
    //     //   })
    //     //   .end()
    //     //   .end()
    //     //   .oneOf('general-js')
    //     //   .end();
    //     // chain.module
    //     //   .rule('server-module')
    //     //   .resource([/render\/.*\/server\/rsc/, /AppProxy/])
    //     //   .layer(webpackRscLayerName)
    //     //   .end();
    //     // chain.module
    //     //   .rule('client-module')
    //     //   .resource([
    //     //     /jsx-dev-runtime/,
    //     //     // /plugin-runtime\/dist\/esm/,
    //     //     // /react-router/,
    //     //     // /react-router-dom/,
    //     //     // /runtime-utils/, // 因为调用 getGlobalAppInit，getGlobalAppInit 必须放在 client layer，保证只有一份，且被 client component 消费
    //     //     // /requestHandler/,
    //     //     // /core\/server\/utils/, // 避免因为 requestHandler 导致 storage 多实例
    //     //     // /core\/plugin/,
    //     //     // /main\/register/,
    //     //     // /plugin-runtime/, // 为了解决 plugin-runtime 中使用 react 的 createContext useState useEffect 的场景
    //     //     // /runtime-global-context/, // 为了解决 setGlobalContext 调用方和定义方不一致的问题
    //     //     // /core\/context\/index/,
    //     //     // /core\/loader/,
    //     //     // /core\/react/,
    //     //     // /core\/server/,
    //     //     // /core\/server/, // ssr 部分的内容必须放在 default 层，否则会报错
    //     //     // /beforeTemplate/,
    //     //     // /react-helmet/,
    //     //     // /ssr/, // 为了 server/ssr 引入时不使用 react-server
    //     //   ])
    //     //   .layer('default')
    //     //   // .exclude.add(/core\/server\/storage/)
    //     //   .end();
    //     // chain
    //     //   .plugin('rsc-server-plugin')
    //     //   .use(WebpackRscServerPlugin, [{ styles }]);
    //     // chain.module
    //     //   .rule(webpackRscLayerName)
    //     //   .issuerLayer(webpackRscLayerName)
    //     //   .resolve.conditionNames.merge([webpackRscLayerName, '...']);
    //     // CSS_RULE_NAMES.forEach(ruleName => {
    //     //   const rule = chain.module.rules.get(ruleName);
    //     //   if (rule) {
    //     //     chain.module
    //     //       .rule(ruleName)
    //     //       .use('custom-loader')
    //     //       .before('ignore-css')
    //     //       .loader(rscCssLoaderPath);
    //     //   }
    //     // });
    //     // chain.module.rule('css').uses.delete('ignore-css');
    //   } else {
    //     // chain.name('client');
    //     // chain.dependencies(['server']);
    //     // chain.module
    //     //   .rule('js')
    //     //   .use('rsc-client-loader')
    //     //   .loader(rscClientLoaderPath)
    //     //   .options({
    //     //     serverReferencesMap,
    //     //     callServerImport: path.resolve(
    //     //       __dirname,
    //     //       'src/framework/client-entry',
    //     //     ),
    //     //   })
    //     //   .before('babel')
    //     //   .end();
    //     // chain
    //     //   .plugin('rsc-client-plugin')
    //     //   .use(WebpackRscClientPlugin, [{ styles }]);
    //   }
    // },
  },
});
