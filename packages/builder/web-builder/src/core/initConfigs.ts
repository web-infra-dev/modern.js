import { STATUS } from '../shared';
import { initPlugins } from './initPlugins';
import { generateWebpackConfig } from './webpackConfig';
import type { Context, PluginStore, WebBuilderOptions } from '../types';

async function modifyBuilderConfig(context: Context) {
  context.status = STATUS.BEFORE_MODIFY_BUILDER_CONFIG;
  const [modified] = await context.hooks.modifyBuilderConfigHook.call(
    context.config,
  );
  context.config = modified;
  context.status = STATUS.AFTER_MODIFY_BUILDER_CONFIG;
}

export async function initConfigs({
  context,
  pluginStore,
  WebBuilderOptions,
}: {
  context: Context;
  pluginStore: PluginStore;
  WebBuilderOptions: Required<WebBuilderOptions>;
}) {
  const { ensureArray } = await import('@modern-js/utils');

  await initPlugins({
    context,
    pluginStore,
  });

  await modifyBuilderConfig(context);

  const targets = ensureArray(WebBuilderOptions.target);
  const webpackConfigs = await Promise.all(
    targets.map(target => generateWebpackConfig({ target, context })),
  );

  return {
    webpackConfigs,
  };
}
