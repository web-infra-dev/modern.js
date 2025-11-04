import {
  type BundlerType,
  type UniBuilderInstance,
  createUniBuilder,
} from '@modern-js/uni-builder';
import { type EnvironmentConfig, mergeRsbuildConfig } from '@rsbuild/core';
import type { Bundler } from '../../types';
import type { BuilderOptions } from '../shared';
import { builderPluginAdapterCopy } from './adapterCopy';
import { createBuilderProviderConfig } from './createBuilderProviderConfig';
import { getBuilderEnvironments } from './getBuilderEnvironments';

/**
 * @param options BuilderOptions
 * @param bundlerType BundlerType
 * @returns BuilderInstance
 */
export async function generateBuilder<B extends Bundler>(
  options: BuilderOptions<B>,
  bundlerType: BundlerType,
) {
  const { normalizedConfig, appContext } = options;

  // create provider
  const tempBuilderConfig = createBuilderProviderConfig<B>(
    normalizedConfig,
    appContext,
  );

  const { environments, builderConfig } = getBuilderEnvironments(
    normalizedConfig,
    appContext,
    tempBuilderConfig,
  );

  if (builderConfig.environments) {
    const mergedEnvironments: Record<string, EnvironmentConfig> = {
      ...environments,
    };

    for (const name in builderConfig.environments) {
      if (environments[name]) {
        mergedEnvironments[name] = mergeRsbuildConfig(
          environments[name],
          builderConfig.environments[name],
        );
      } else {
        mergedEnvironments[name] = builderConfig.environments[name];
      }
    }

    builderConfig.environments = mergedEnvironments;
  } else {
    builderConfig.environments = environments;
  }

  const builder = await createUniBuilder({
    cwd: appContext.appDirectory,
    rscClientRuntimePath: `@${appContext.metaName}/runtime/rsc/client`,
    rscServerRuntimePath: `@${appContext.metaName}/runtime/rsc/server`,
    internalDirectory: appContext.internalDirectory,
    frameworkConfigPath: appContext.configFile || undefined,
    bundlerType,
    config: builderConfig,
  });

  await applyBuilderPlugins(builder, options);

  return builder;
}

async function applyBuilderPlugins<B extends Bundler>(
  builder: UniBuilderInstance,
  options: BuilderOptions<B>,
) {
  const {
    builderPluginAdapterBasic,
    builderPluginAdapterHtml,
    builderPluginAdapterSSR,
    builderPluginAdapterHooks,
  } = await import('../shared/builderPlugins/index.js');

  builder.addPlugins([
    builderPluginAdapterBasic(options),
    builderPluginAdapterSSR(options),
    builderPluginAdapterHtml(options),
    builderPluginAdapterHooks(options),
  ]);

  builder.addPlugins([builderPluginAdapterCopy(options)], {
    environment: 'web',
  });

  const { normalizedConfig } = options;
  if (!normalizedConfig.output.disableNodePolyfill) {
    const { pluginNodePolyfill } = await import(
      '@rsbuild/plugin-node-polyfill'
    );

    builder.addPlugins([pluginNodePolyfill()]);
  }
}
