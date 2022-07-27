import type { Context, PluginStore } from '../types';
import { initPlugins } from './initPlugins';

export async function initConfigs({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  const WebpackChain = (await import('@modern-js/utils/webpack-chain')).default;

  const {
    modifyWebpackChainHook,
    modifyBuilderConfigHook,
    modifyWebpackConfigHook,
  } = await initPlugins({
    context,
    pluginStore,
  });

  const [modifiedBuilderConfig] = await modifyBuilderConfigHook.call(
    context.config,
  );
  context.config = modifiedBuilderConfig;

  const chain = new WebpackChain();
  const [modifiedChain] = await modifyWebpackChainHook.call(chain);

  const webpackConfig = modifiedChain.toConfig();
  const [modifiedWebpackConfig] = await modifyWebpackConfigHook.call(
    webpackConfig,
  );

  // eslint-disable-next-line no-console
  console.log('final webpack config', modifiedWebpackConfig);
}
