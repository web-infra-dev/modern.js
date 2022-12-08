import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  ModifyBuilderConfigFn,
} from './hooks';
import { BuilderContext } from './context';
import type { SharedBuilderConfig, ShareNormalizedConfig } from './config';

export type PluginStore = {
  readonly plugins: BuilderPlugin[];
  addPlugins: (plugins: BuilderPlugin[], options?: { before?: string }) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
};

export type BuilderPlugin<API = any> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};

type PluginsFn = () => Promise<BuilderPlugin>;

export type Plugins = {
  cleanOutput: PluginsFn;
  startUrl: PluginsFn;
};

/**
 * Define a generic builder plugin API that provider can extend as needed.
 */
export type DefaultBuilderPluginAPI<
  Config extends SharedBuilderConfig = SharedBuilderConfig,
  NormalizedConfig extends ShareNormalizedConfig = ShareNormalizedConfig,
  BundlerConfig = unknown,
  Compiler = unknown,
> = {
  context: Readonly<BuilderContext>;
  isPluginExists: PluginStore['isPluginExists'];

  onExit: (fn: OnExitFn) => void;
  onAfterBuild: (fn: OnAfterBuildFn) => void;
  onBeforeBuild: (fn: OnBeforeBuildFn<BundlerConfig>) => void;
  onDevCompileDone: (fn: OnDevCompileDoneFn) => void;
  onAfterStartDevServer: (fn: OnAfterStartDevServerFn) => void;
  onBeforeStartDevServer: (fn: OnBeforeStartDevServerFn) => void;
  onAfterCreateCompiler: (fn: OnAfterCreateCompilerFn<Compiler>) => void;
  onBeforeCreateCompiler: (fn: OnBeforeCreateCompilerFn<BundlerConfig>) => void;

  /**
   * Get the relative paths of generated HTML files.
   * The key is entry name and the value is path.
   */
  getHTMLPaths: () => Record<string, string>;
  getBuilderConfig: () => Readonly<Config>;
  getNormalizedConfig: () => Readonly<NormalizedConfig>;

  modifyBuilderConfig: (fn: ModifyBuilderConfigFn<Config>) => void;
};

export type DefaultBuilderPlugin = BuilderPlugin<DefaultBuilderPluginAPI>;
