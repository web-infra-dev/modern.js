import {
  debug,
  isDebug,
  type PluginStore,
  type InspectConfigOptions,
  type CreateBuilderOptions,
} from '@modern-js/builder-shared';
import { initPlugins } from './initPlugins';
import { generateWebpackConfig } from './webpackConfig';
import { stringifyBuilderConfig } from './inspectBuilderConfig';
import { stringifyWebpackConfig } from './inspectBundlerConfig';
import type { Context } from '../types';

async function modifyBuilderConfig(context: Context) {
  debug('modify builder config');
  const [modified] = await context.hooks.modifyBuilderConfigHook.call(
    context.config,
  );
  context.config = modified;
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
      stringifyBuilderConfig({
        context,
        inspectOptions,
      });
      stringifyWebpackConfig({
        context,
        inspectOptions,
        builderOptions,
        webpackConfigs,
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
