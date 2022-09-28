import _ from '@modern-js/utils/lodash';
import { normalizeConfig } from '../config/normalize';
import { debug, deepFreezed, isDebug } from '../shared';
import type {
  BuilderOptions,
  Context,
  InspectOptions,
  PluginStore,
} from '../types';
import { initPlugins } from './initPlugins';
import { stringifyBuilderConfig } from './inspectBuilderConfig';
import { stringifyWebpackConfig } from './inspectWebpackConfig';
import { generateWebpackConfig } from './webpackConfig';

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
  builderOptions: Required<BuilderOptions>;
};

export async function initConfigs({
  context,
  pluginStore,
  builderOptions,
}: InitConfigsOptions) {
  await initPlugins({
    context,
    pluginStore,
  });

  await modifyBuilderConfig(context);
  context.normalizedConfig = deepFreezed(normalizeConfig(context.config));

  const targets = _.castArray(builderOptions.target);
  const webpackConfigs = await Promise.all(
    targets.map(target => generateWebpackConfig({ target, context })),
  );

  // write builder config and webpack config to disk in debug mode.
  if (isDebug()) {
    const inspect = () => {
      const inspectOptions: InspectOptions = {
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
