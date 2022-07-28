import { STATUS } from '../shared';
import { initPlugins } from './initPlugins';

import type { AsyncHook } from './createHook';
import type {
  Context,
  PluginStore,
  ModifyWebpackChainFn,
  ModifyBuilderConfigFn,
  ModifyWebpackConfigFn,
  WebpackConfig,
} from '../types';

async function modifyBuilderConfig(
  context: Context,
  hook: AsyncHook<ModifyBuilderConfigFn>,
) {
  context.setStatus(STATUS.BEFORE_MODIFY_BUILDER_CONFIG);
  const [modified] = await hook.call(context.config);
  context.config = modified;
  context.setStatus(STATUS.AFTER_MODIFY_BUILDER_CONFIG);
}

async function modifyWebpackChain(
  context: Context,
  hook: AsyncHook<ModifyWebpackChainFn>,
) {
  context.setStatus(STATUS.BEFORE_MODIFY_WEBPACK_CHAIN);

  const WebpackChain = (await import('@modern-js/utils/webpack-chain')).default;
  const chain = new WebpackChain();
  const [modified] = await hook.call(chain);

  context.setStatus(STATUS.AFTER_MODIFY_WEBPACK_CHAIN);

  return modified;
}

async function modifyWebpackConfig(
  context: Context,
  hook: AsyncHook<ModifyWebpackConfigFn>,
  webpackConfig: WebpackConfig,
) {
  context.setStatus(STATUS.BEFORE_MODIFY_WEBPACK_CONFIG);

  const [modified] = await hook.call(webpackConfig);

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
  const {
    modifyWebpackChainHook,
    modifyBuilderConfigHook,
    modifyWebpackConfigHook,
  } = await initPlugins({
    context,
    pluginStore,
  });

  await modifyBuilderConfig(context, modifyBuilderConfigHook);

  const chain = await modifyWebpackChain(context, modifyWebpackChainHook);

  const webpackConfig = await modifyWebpackConfig(
    context,
    modifyWebpackConfigHook,
    chain.toConfig(),
  );

  // eslint-disable-next-line no-console
  console.log('final webpack config', webpackConfig);
}
