import {
  debug,
  isDebug,
  deepFreezed,
  type PluginStore,
  type InspectConfigOptions,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { initPlugins } from './initPlugins';
import { inspectConfig } from './inspectConfig';
import { generateWebpackConfig } from './webpackConfig';
import { normalizeConfig } from '../config/normalize';
import type { Context } from '../types';

async function modifyBuilderConfig(context: Context) {
  debug('modify builder config');
  const [modified] = await context.hooks.modifyBuilderConfigHook.call(
    context.config,
  );
  context.config = deepFreezed(modified);
  debug('modify builder config done');
}

export type InitConfigsOptions = {
  context: Context;
  pluginStore: PluginStore;
  builderOptions: Required<CreateBuilderOptions>;
};

export async function initConfigs({
  context,
  pluginStore,
  builderOptions,
}: InitConfigsOptions) {
  const { ensureArray } = await import('@modern-js/utils');

  await context.configValidatingTask;
  await initPlugins({
    context,
    pluginStore,
  });

  await modifyBuilderConfig(context);
  context.normalizedConfig = deepFreezed(normalizeConfig(context.config));

  const targets = ensureArray(builderOptions.target);
  const webpackConfigs = await Promise.all(
    targets.map(target => generateWebpackConfig({ target, context })),
  );

  // write builder config and webpack config to disk in debug mode
  if (isDebug()) {
    const inspect = () => {
      const inspectOptions: InspectConfigOptions = {
        verbose: true,
        writeToDisk: true,
      };
      inspectConfig({
        context,
        pluginStore,
        inspectOptions,
        builderOptions,
        bundlerConfigs: webpackConfigs,
      });
    };

    // run inspect later to avoid cleaned by cleanOutput plugin
    context.hooks.onBeforeBuildHook.tap(inspect);
    context.hooks.onBeforeStartDevServerHooks.tap(inspect);
  }

  return {
    webpackConfigs,
  };
}
