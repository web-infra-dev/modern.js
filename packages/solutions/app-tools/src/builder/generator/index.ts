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
import { updateBuilderWithEnvironments } from './getBuilderEnvironments';

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

  const builderConfig = updateBuilderWithEnvironments(
    normalizedConfig,
    appContext,
    tempBuilderConfig,
  );

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

async function applyBuilderPlugins(
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
    environment: 'client',
  });

  const { normalizedConfig } = options;
}
