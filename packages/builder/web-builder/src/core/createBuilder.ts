import { pick } from '../shared';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import type { PluginStore, BuilderOptions } from '../types';
import type { InspectOptions } from './inspectWebpackConfig';

export function mergeBuilderOptions(options?: BuilderOptions) {
  const DEFAULT_OPTIONS: Required<BuilderOptions> = {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    builderConfig: {},
    framework: 'modern-js',
  };

  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}

export async function createBuilder(options?: BuilderOptions) {
  const builderOptions = mergeBuilderOptions(options);
  const context = await createContext(builderOptions);
  const publicContext = createPublicContext(context);
  const pluginStore = createPluginStore();

  await addDefaultPlugins(pluginStore);

  const build = async () => {
    const { build: buildImpl } = await import('./build');
    return buildImpl({ context, pluginStore, builderOptions });
  };

  const createCompiler = async () => {
    const { createCompiler } = await import('./createCompiler');
    return createCompiler({ context, pluginStore, builderOptions });
  };

  const inspectWebpackConfig = async (inspectOptions: InspectOptions = {}) => {
    const { inspectWebpackConfig: inspectWebpackConfigImpl } = await import(
      './inspectWebpackConfig'
    );
    return inspectWebpackConfigImpl({
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
    inspectWebpackConfig,
  };
}

async function addDefaultPlugins(pluginStore: PluginStore) {
  const { PluginHMR } = await import('../plugins/hmr');
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
  const { PluginDevtool } = await import('../plugins/devtool');
  const { PluginResolve } = await import('../plugins/resolve');
  const { PluginDefine } = await import('../plugins/define');
  const { PluginProgress } = await import('../plugins/progress');
  const { PluginMinimize } = await import('../plugins/minimize');
  const { PluginManifest } = await import('../plugins/manifest');
  const { PluginCleanOutput } = await import('../plugins/cleanOutput');
  const { PluginBabel } = await import('../plugins/babel');
  const { PluginTsLoader } = await import('../plugins/tsLoader');
  const { PluginTsChecker } = await import('../plugins/tsChecker');
  const { PluginCss } = await import('../plugins/css');
  const { PluginSass } = await import('../plugins/sass');
  const { PluginLess } = await import('../plugins/less');
  const { PluginReact } = await import('../plugins/react');

  pluginStore.addPlugins([
    // Plugins that provide basic webpack config
    PluginBasic(),
    PluginEntry(),
    PluginCache(),
    PluginTarget(),
    PluginOutput(),
    PluginDevtool(),
    PluginResolve(),
    PluginDefine(),

    // Plugins that provide basic features
    PluginHMR(),
    PluginCopy(),
    PluginFont(),
    PluginHtml(),
    PluginImage(),
    PluginMedia(),
    PluginMoment(),
    PluginProgress(),
    PluginMinimize(),
    PluginManifest(),
    PluginCleanOutput(),
    PluginTsLoader(),
    PluginBabel(),
    PluginTsChecker(),
    PluginCss(),
    PluginSass(),
    PluginLess(),
    PluginReact(),
  ]);
}
