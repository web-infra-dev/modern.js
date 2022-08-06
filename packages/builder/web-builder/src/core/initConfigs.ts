import { STATUS } from '../shared';
import { initPlugins } from './initPlugins';
import { generateWebpackConfig } from './webpackConfig';
import type { Context, PluginStore, BuilderOptions } from '../types';

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
  builderOptions,
}: {
  context: Context;
  pluginStore: PluginStore;
  builderOptions: Required<BuilderOptions>;
}) {
  const { ensureArray } = await import('@modern-js/utils');

  await context.configValidatingTask;
  await initPlugins({
    context,
    pluginStore,
  });

  await modifyBuilderConfig(context);

  const targets = ensureArray(builderOptions.target);
  const webpackConfigs = await Promise.all(
    targets.map(target => generateWebpackConfig({ target, context })),
  );

  return {
    webpackConfigs,
  };
}
