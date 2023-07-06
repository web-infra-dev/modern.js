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
  ModifyBundlerChainFn,
} from './hooks';
import { BuilderContext } from './context';
import { SharedBuilderConfig, SharedNormalizedConfig } from './config';
import { PromiseOrNot } from './utils';

export type PluginStore = {
  readonly plugins: BuilderPlugin[];
  addPlugins: (plugins: BuilderPlugin[], options?: { before?: string }) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
  /** The plugin API. */
  pluginAPI?: DefaultBuilderPluginAPI;
};

export type BuilderPlugin<API = any> = {
  name: string;
  setup: (api: API) => PromiseOrNot<void>;
  pre?: string[];
  post?: string[];
  remove?: string[];
};

type PluginsFn = () => Promise<BuilderPlugin>;

export type Plugins = {
  cleanOutput: PluginsFn;
  startUrl: PluginsFn;
  fileSize: PluginsFn;
  devtool: PluginsFn;
  target: PluginsFn;
  entry: PluginsFn;
  cache: PluginsFn;
  yaml: PluginsFn;
  toml: PluginsFn;
  splitChunks: PluginsFn;
  inlineChunk: PluginsFn;
  bundleAnalyzer: PluginsFn;
  assetsRetry: PluginsFn;
  font: PluginsFn;
  media: PluginsFn;
  image: PluginsFn;
  svg: PluginsFn;
  html: PluginsFn;
  antd: PluginsFn;
  arco: PluginsFn;
  tsChecker: PluginsFn;
  checkSyntax: PluginsFn;
  rem: PluginsFn;
  wasm: PluginsFn;
  moment: PluginsFn;
  externals: PluginsFn;
  sourceBuild: PluginsFn;
};

/**
 * Define a generic builder plugin API that provider can extend as needed.
 */
export type DefaultBuilderPluginAPI<
  Config extends Record<string, any> = Record<string, any>,
  NormalizedConfig extends Record<string, any> = Record<string, any>,
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
  getNormalizedConfig: () => NormalizedConfig;

  modifyBuilderConfig: (fn: ModifyBuilderConfigFn<Config>) => void;
  modifyBundlerChain: (fn: ModifyBundlerChainFn) => void;
};

export type SharedBuilderPluginAPI = DefaultBuilderPluginAPI<
  SharedBuilderConfig,
  SharedNormalizedConfig
>;

export type DefaultBuilderPlugin = BuilderPlugin<SharedBuilderPluginAPI>;
