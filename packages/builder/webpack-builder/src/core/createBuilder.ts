import type webpack from 'webpack';
import { debug, pick } from '../shared';
import { applyDefaultPlugins } from '../shared/plugin';
import type {
  BuilderOptions,
  Context,
  InspectOptions,
  PromiseOrNot,
} from '../types';
import { webpackBuild } from './build';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import { initConfigs } from './initConfigs';

export type ExecuteBuild = (
  context: Context,
  configs: webpack.Configuration[],
) => PromiseOrNot<{ stats: webpack.MultiStats } | void>;

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

  const build = async (executeBuild?: ExecuteBuild) => {
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
    }

    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
      builderOptions,
    });

    await context.hooks.onBeforeBuildHook.call({
      webpackConfigs,
    });

    const executeResult = await executeBuild?.(context, webpackConfigs);

    await context.hooks.onAfterBuildHook.call({
      stats: executeResult?.stats,
    });
  };

  return {
    context,
    builderOptions,
    publicContext,
    pluginStore,
    build,
  };
}

export const createDefaultBuilderOptions = (): Required<BuilderOptions> => ({
  cwd: process.cwd(),
  entry: {},
  target: ['web'],
  configPath: null,
  builderConfig: {},
  framework: 'modern-js',
  validate: true,
});

export async function createBuilder(options?: BuilderOptions) {
  const builderOptions: Required<BuilderOptions> = {
    ...createDefaultBuilderOptions(),
    ...options,
  };
  const context = await createContext(builderOptions);
  const { build, pluginStore, publicContext } = createPrimaryBuilder(
    builderOptions,
    context,
  );

  debug('add default plugins');
  pluginStore.addPlugins(await applyDefaultPlugins());
  debug('add default plugins done');

  const createCompiler = async () => {
    const { createCompiler } = await import('./createCompiler');
    return createCompiler({ context, pluginStore, builderOptions });
  };

  const startDevServer = async () => {
    const { startDevServer } = await import('./startDevServer');
    return startDevServer({ context, pluginStore, builderOptions });
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
    build: () => build(webpackBuild),
    context: publicContext,
    createCompiler,
    startDevServer,
    inspectBuilderConfig,
    inspectWebpackConfig,
  };
}

export type BuilderInstance = Awaited<ReturnType<typeof createBuilder>>;
