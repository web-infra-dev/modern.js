import type { Context, PluginStore } from '../types';
import { setupPlugins } from './setupPlugins';

export async function createCompiler({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  const { modifyWebpackChainHook } = await setupPlugins({
    context,
    pluginStore,
  });
  modifyWebpackChainHook.call(context.chain);

  // eslint-disable-next-line no-console
  console.log('webpack config', context.chain.toConfig());
}
