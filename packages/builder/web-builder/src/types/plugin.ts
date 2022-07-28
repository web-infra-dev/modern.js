import type { WebBuilderConfig } from './config';
import type { WebBuilderContext } from './context';
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
  plugins: WebBuilderPlugin[];
  addPlugins: (plugins: WebBuilderPlugin[]) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
};

export type WebBuilderPluginAPI = {
  context: WebBuilderContext;
  isPluginExists: PluginStore['isPluginExists'];
  getBuilderConfig: () => WebBuilderConfig;

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

export type WebBuilderPlugin = {
  name: string;
  setup: (api: WebBuilderPluginAPI) => Promise<void> | void;
};
