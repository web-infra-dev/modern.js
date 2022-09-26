import { debug, mergeBuilderOptions, pick } from '../shared';
import { applyDefaultPlugins } from '../shared/plugin';
import { BuildOptions } from './build';
import { initConfigs } from './initConfigs';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import type { BuilderOptions, Context, InspectOptions } from '../types';

/**
 * Create primary builder.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it won't take much cost.
 */
export function createPrimaryBuilder(
  builderOptions: Required<BuilderOptions>,
  context: Context,
) {
  const publicContext = createPublicContext(context);
  const pluginStore = createPluginStore();
  return {
    context,
    builderOptions,
    publicContext,
    pluginStore,
  };
}

export async function createBuilder(options?: BuilderOptions) {
  const builderOptions = mergeBuilderOptions(options);
  const context = await createContext(builderOptions);
  const { pluginStore, publicContext } = createPrimaryBuilder(
    builderOptions,
    context,
  );

  debug('add default plugins');
  pluginStore.addPlugins(await applyDefaultPlugins());
  debug('add default plugins done');

  const startDevServer = async () => {
    const { startDevServer } = await import('./startDevServer');
    return startDevServer({ context, pluginStore, builderOptions });
  };

  const createCompiler = async () => {
    const { createWatchCompiler } = await import('./createCompiler');
    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
      builderOptions,
    });
    return createWatchCompiler(context, webpackConfigs);
  };

  const build = async (options?: BuildOptions) => {
    const { build: buildImpl, webpackBuild } = await import('./build');
    return buildImpl(
      { context, pluginStore, builderOptions },
      options,
      webpackBuild,
    );
  };

  const inspectWebpackConfig = async (inspectOptions: InspectOptions = {}) => {
    return (await import('./inspectWebpackConfig')).inspectWebpackConfig({
      context,
      pluginStore,
      builderOptions,
      inspectOptions,
    });
  };

  const inspectBuilderConfig = async (inspectOptions: InspectOptions = {}) => {
    return (await import('./inspectBuilderConfig')).inspectBuilderConfig({
      context,
      pluginStore,
      builderOptions,
      inspectOptions,
    });
  };

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    context: publicContext,
    createCompiler,
    startDevServer,
    inspectBuilderConfig,
    inspectWebpackConfig,
  };
}

export type BuilderInstance = Awaited<ReturnType<typeof createBuilder>>;
