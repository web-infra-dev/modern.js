import { applyBaseConfig } from '../../utils/applyBaseConfig';
import ReactServerWebpackPlugin from 'react-server-dom-webpack/plugin';
import path from 'path';

export default applyBaseConfig({
  runtime: {
    state: false,
    router: false,
  },
  source: {
    // 避免 Modern.js 项目代码中用的是其他版本
    alias: {
      // react$: require.resolve('react'),
      // 'react-dom/client': require.resolve('react-dom/client'),
      // 'react-dom': require.resolve('react-dom'),
    },
  },
  tools: {
    babel(config, { modifyPresetReactOptions }) {
      modifyPresetReactOptions({
        runtime: 'automatic',
      });
    },
    devServer: {
      hot: false,
    },
    // webpack(config, ctx) {
    //   config.resolve.conditionNames = ['require', 'node'];
    // },
    bundlerChain(chain) {
      chain
        .plugin('react-server-dom-webpack-plugin')
        .use(ReactServerWebpackPlugin, [
          {
            isServer: false,
            clientReferences: [
              {
                directory: './src',
                recursive: true,
                include: /\.(js|jsx|ts|tsx)$/,
              },
            ],
          },
        ]);
    },
  },
});
