import { STATUS } from '../shared';
import { initPlugins } from './initPlugins';
import type { Context, PluginStore, WebpackConfig } from '../types';

async function modifyBuilderConfig(context: Context) {
  context.setStatus(STATUS.BEFORE_MODIFY_BUILDER_CONFIG);
  const [modified] = await context.hooks.modifyBuilderConfigHook.call(
    context.config,
  );
  context.config = modified;
  context.setStatus(STATUS.AFTER_MODIFY_BUILDER_CONFIG);
}

async function modifyWebpackChain(context: Context) {
  context.setStatus(STATUS.BEFORE_MODIFY_WEBPACK_CHAIN);

  const WebpackChain = (await import('@modern-js/utils/webpack-chain')).default;
  const chain = new WebpackChain();
  const [modified] = await context.hooks.modifyWebpackChainHook.call(chain);

  context.setStatus(STATUS.AFTER_MODIFY_WEBPACK_CHAIN);

  return modified;
}

async function modifyWebpackConfig(
  context: Context,
  webpackConfig: WebpackConfig,
) {
  context.setStatus(STATUS.BEFORE_MODIFY_WEBPACK_CONFIG);

  const [modified] = await context.hooks.modifyWebpackConfigHook.call(
    webpackConfig,
  );

  context.setStatus(STATUS.AFTER_MODIFY_WEBPACK_CONFIG);

  return modified;
}

export async function initConfigs({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  await initPlugins({
    context,
    pluginStore,
  });

  await modifyBuilderConfig(context);
  const chain = await modifyWebpackChain(context);
  const webpackConfig = await modifyWebpackConfig(context, chain.toConfig());

  // eslint-disable-next-line no-console
  console.log('final webpack config', webpackConfig);
}
