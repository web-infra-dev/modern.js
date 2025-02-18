import {
  type AppTools,
  type CliPluginFuture,
  appTools,
  defineConfig,
} from '@modern-js/app-tools';

const MyPlugin = (): CliPluginFuture<AppTools> => ({
  name: 'test',
  setup(api) {
    api.config(() => {
      return {
        tools: {
          webpack: () => {
            console.log('tools.webpack');
          },
          rspack: () => {
            console.log('tools.rspack');
          },
          bundlerChain: () => {
            console.log('tools.bundlerChain');
          },
          webpackChain: () => {
            console.log('tools.webpackChain');
          },
        },
      };
    });
    api.modifyBundlerChain(async (chain, utils) => {
      console.log('modifyBundlerChain');
    });
    api.modifyRsbuildConfig(async (config, utils) => {
      console.log('modifyRsbuildConfig');
    });
    api.modifyRspackConfig(async (config, utils) => {
      console.log('modifyRspackConfig');
    });
    api.modifyWebpackChain(async (chain, utils) => {
      console.log('modifyWebpackChain');
    });
    api.modifyWebpackConfig(async (config, utils) => {
      console.log('modifyWebpackConfig');
    });
  },
});
export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [
    appTools({
      bundler: process.env.BUNDLER === 'webpack' ? 'webpack' : 'rspack',
    }),
    MyPlugin(),
  ],
});
