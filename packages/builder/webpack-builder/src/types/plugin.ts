import type { FinalBuilderConfig } from './config';
import type { BuilderContext } from './context';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
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
  getBuilderConfig: () => FinalBuilderConfig;

  // Hooks
  onExit: (fn: OnExitFn) => void;
  onAfterBuild: (fn: OnAfterBuildFn) => void;
  onBeforeBuild: (fn: OnBeforeBuildFn) => void;
  onAfterCreateCompiler: (fn: OnAfterCreateCompilerFn) => void;
  onBeforeCreateCompiler: (fn: OnBeforeCreateCompilerFn) => void;

  // Modifiers
  modifyWebpackChain: (fn: ModifyWebpackChainFn) => void;
  modifyWebpackConfig: (fn: ModifyWebpackConfigFn) => void;
  modifyBuilderConfig: (fn: ModifyBuilderConfigFn) => void;
};

export type BuilderPlugin = {
  name: string;
  setup: (api: BuilderPluginAPI) => Promise<void> | void;
};
