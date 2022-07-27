import type { Context, PluginStore } from '../types';
import { setupPlugins } from './setupPlugins';

export function createCompiler({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  const { modifyWebpackChainHook } = setupPlugins({ context, pluginStore });
  modifyWebpackChainHook.call(context.chain);

  // eslint-disable-next-line no-console
  console.log('webpack config', context.chain.toConfig());
}
