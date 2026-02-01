import {
  type BuilderInstance,
  type BundlerType,
  createBuilder,
} from '@modern-js/builder';
import { type EnvironmentConfig, mergeRsbuildConfig } from '@rsbuild/core';
import type { BuilderOptions } from '../shared';
import {
  builderPluginAdapterBasic,
  builderPluginAdapterHooks,
  builderPluginAdapterHtml,
  builderPluginAdapterSSR,
} from '../shared/builderPlugins';
import { builderPluginAdapterCopy } from './adapterCopy';
import { createBuilderProviderConfig } from './createBuilderProviderConfig';
import { getBuilderEnvironments } from './getBuilderEnvironments';

/**
 * @param options BuilderOptions
 * @param bundlerType BundlerType
 * @returns BuilderInstance
 */
export async function generateBuilder(
  options: BuilderOptions,
  bundlerType: BundlerType,
) {
  const { normalizedConfig, appContext } = options;

  // create provider
  const tempBuilderConfig = createBuilderProviderConfig(
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

  const builder = await createBuilder({
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

export async function applyBuilderPlugins(
  builder: BuilderInstance,
  options: BuilderOptions,
) {
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
}
