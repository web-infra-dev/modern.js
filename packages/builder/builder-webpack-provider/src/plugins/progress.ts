import type { BuilderPlugin } from '../types';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { UseWebpackProgressPlugin } from '../webpackPlugins/ProgressPlugin';

/**
 * @deprecated
 * 旧版 进度条插件(已废弃)
 */
export const PluginProgressOld = (): BuilderPlugin => ({
  name: 'webpackBuilderPluginProgress',
  setup(api) {
    api.modifyWebpackChain(async (chain, { isServer, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      if (!config.dev?.progressBar) {
        return;
      }
      const { default: WebpackBar } = await import('../../compiled/webpackbar');
      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(WebpackBar, [
        {
          name: isServer ? 'server' : 'client',
        },
      ]);
    });
  },
});

export const PluginProgress = (): BuilderPlugin => ({
  name: 'webpackBuilderPluginProgress',
  setup(api) {
    api.modifyWebpackConfig((webpack_config, { webpack }) => {
      const config = api.getBuilderConfig();
      const options = config.dev?.progressBar;
      let plugin;
      if (!options) {
        return;
      } else if (options === true) {
        plugin = UseWebpackProgressPlugin({}, webpack);
      } else {
        plugin = UseWebpackProgressPlugin(options, webpack);
      }
      if (plugin) {
        webpack_config.plugins?.push(plugin);
      }
    });
  },
});
