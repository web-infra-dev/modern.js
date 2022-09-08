import { pick, debug, mergeBuilderOptions } from '../shared';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import { initConfigs } from './initConfigs';
import { webpackBuild } from './build';
import type webpack from 'webpack';
import type {
  Context,
  PluginStore,
  BuilderOptions,
  InspectOptions,
} from '../types';

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

  const build = async (
    executeBuild?: (
      configs: webpack.Configuration[],
    ) => Promise<{ stats: webpack.MultiStats }>,
  ) => {
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

    const executeResult = await executeBuild?.(webpackConfigs);

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

export async function createBuilder(options?: BuilderOptions) {
  const builderOptions = mergeBuilderOptions(options);
  const context = await createContext(builderOptions);
  const { build, pluginStore, publicContext } = createPrimaryBuilder(
    builderOptions,
    context,
  );

  await addDefaultPlugins(pluginStore);

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

async function addDefaultPlugins(pluginStore: PluginStore) {
  debug('add default plugins');

  const { PluginHMR } = await import('../plugins/hmr');
  const { PluginSvg } = await import('../plugins/svg');
  const { PluginPug } = await import('../plugins/pug');
  const { PluginCopy } = await import('../plugins/copy');
  const { PluginFont } = await import('../plugins/font');
  const { PluginHtml } = await import('../plugins/html');
  const { PluginBasic } = await import('../plugins/basic');
  const { PluginCache } = await import('../plugins/cache');
  const { PluginEntry } = await import('../plugins/entry');
  const { PluginImage } = await import('../plugins/image');
  const { PluginMedia } = await import('../plugins/media');
  const { PluginTarget } = await import('../plugins/target');
  const { PluginOutput } = await import('../plugins/output');
  const { PluginMoment } = await import('../plugins/moment');
  const { PluginDefine } = await import('../plugins/define');
  const { PluginDevtool } = await import('../plugins/devtool');
  const { PluginResolve } = await import('../plugins/resolve');
  const { PluginFallback } = await import('../plugins/fallback');
  const { PluginProgress } = await import('../plugins/progress');
  const { PluginMinimize } = await import('../plugins/minimize');
  const { PluginManifest } = await import('../plugins/manifest');
  const { PluginFileSize } = await import('../plugins/fileSize');
  const { PluginCleanOutput } = await import('../plugins/cleanOutput');
  const { PluginModuleScopes } = await import('../plugins/moduleScopes');
  const { PluginBabel } = await import('../plugins/babel');
  const { PluginTsLoader } = await import('../plugins/tsLoader');
  const { PluginTsChecker } = await import('../plugins/tsChecker');
  const { PluginCss } = await import('../plugins/css');
  const { PluginSass } = await import('../plugins/sass');
  const { PluginLess } = await import('../plugins/less');
  const { PluginReact } = await import('../plugins/react');
  const { PluginBundleAnalyzer } = await import('../plugins/bundleAnalyzer');
  const { PluginToml } = await import('../plugins/toml');
  const { PluginYaml } = await import('../plugins/yaml');
  const { PluginSplitChunks } = await import('../plugins/splitChunks');
  const { PluginInspector } = await import('../plugins/inspector');
  const { PluginSRI } = await import('../plugins/sri');
  const { PluginStartUrl } = await import('../plugins/startUrl');

  pluginStore.addPlugins([
    // Plugins that provide basic webpack config
    PluginBasic(),
    PluginEntry(),
    PluginCache(),
    PluginTarget(),
    PluginOutput(),
    PluginDevtool(),
    PluginResolve(),

    // fileSize plugin will read the previous dist files.
    // So we should register fileSize plugin before cleanOutput plugin.
    // And cleanOutput plugin should be registered before other plugins.
    PluginFileSize(),
    PluginCleanOutput(),

    // Plugins that provide basic features
    PluginHMR(),
    PluginSvg(),
    PluginPug(),
    PluginCopy(),
    PluginFont(),
    PluginHtml(),
    PluginImage(),
    PluginMedia(),
    PluginMoment(),
    PluginDefine(),
    PluginProgress(),
    PluginMinimize(),
    PluginManifest(),
    PluginModuleScopes(),
    PluginTsLoader(),
    PluginBabel(),
    PluginTsChecker(),
    PluginCss(),
    PluginSass(),
    PluginLess(),
    PluginReact(),
    PluginBundleAnalyzer(),
    PluginToml(),
    PluginYaml(),
    PluginSplitChunks(),
    PluginInspector(),
    PluginSRI(),
    PluginStartUrl(),

    // fallback should be the last plugin
    PluginFallback(),
  ]);

  debug('add default plugins done');
}
