import {
  type AppTools,
  type CliPlugin,
  appTools,
  defineConfig,
} from '@modern-js/app-tools';

const MyPlugin = (): CliPlugin<AppTools> => ({
  name: 'test',
  setup(api) {
    api.config(() => {
      return {
        tools: {
          rspack: () => {
            console.log('tools.rspack');
          },
          bundlerChain: () => {
            console.log('tools.bundlerChain');
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
  },
});
export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [appTools(), MyPlugin()],
  performance: {
    buildCache: false,
  },
});
