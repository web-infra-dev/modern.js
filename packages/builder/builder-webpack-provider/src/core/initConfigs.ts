import {
  debug,
  isDebug,
  type PluginStore,
  type InspectConfigOptions,
  type CreateBuilderOptions,
  deepFreezed,
} from '@modern-js/builder-shared';
import { initPlugins } from './initPlugins';
import { generateWebpackConfig } from './webpackConfig';
import { stringifyBuilderConfig } from './inspectBuilderConfig';
import { stringifyWebpackConfig } from './inspectBundlerConfig';
<<<<<<< HEAD
<<<<<<< HEAD:packages/builder/builder-webpack-provider/src/core/initConfigs.ts
import type { Context } from '../types';
import { normalizeConfig } from '../config/normalize';
=======
import type {
  Context,
  PluginStore,
  BuilderOptions,
  InspectOptions,
} from '../types';
>>>>>>> f7e6f5a72 (chore(builder): rename inspectBundlerConfig method (#1790)):packages/builder/webpack-builder/src/core/initConfigs.ts
=======
import type { Context } from '../types';
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

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
