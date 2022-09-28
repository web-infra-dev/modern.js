import type { BuilderConfig, NormalizedConfig } from './config';
import type { BuilderContext } from './context';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
} from './hooks';

export type PluginStore = {
  readonly plugins: BuilderPlugin[];
  addPlugins: (plugins: BuilderPlugin[]) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
};

export type BuilderPluginAPI = {
  context: Readonly<BuilderContext>;
  isPluginExists: PluginStore['isPluginExists'];
  getBuilderConfig: () => BuilderConfig;
  getNormalizedConfig: () => NormalizedConfig;

  // Hooks
  onExit: (fn: OnExitFn) => void;
  onAfterBuild: (fn: OnAfterBuildFn) => void;
  onBeforeBuild: (fn: OnBeforeBuildFn) => void;
  onDevCompileDone: (fn: OnDevCompileDoneFn) => void;
  onAfterCreateCompiler: (fn: OnAfterCreateCompilerFn) => void;
  onBeforeCreateCompiler: (fn: OnBeforeCreateCompilerFn) => void;
  onAfterStartDevServer: (fn: OnAfterStartDevServerFn) => void;
  onBeforeStartDevServer: (fn: OnBeforeStartDevServerFn) => void;

  // Modifiers
  modifyWebpackChain: (fn: ModifyWebpackChainFn) => void;
  modifyWebpackConfig: (fn: ModifyWebpackConfigFn) => void;
  modifyBuilderConfig: (fn: ModifyBuilderConfigFn) => void;
};

export type BuilderPlugin = {
  name: string;
  setup: (api: BuilderPluginAPI) => Promise<void> | void;
};
