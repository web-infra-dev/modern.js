import type {
  BuilderContext,
  PluginStore,
  BuilderPlugin as BaseBuilderPlugin,
} from '@modern-js/builder-shared';
import type { BuilderConfig } from './config';
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

export type BuilderPluginAPI = {
  context: Readonly<BuilderContext>;
  isPluginExists: PluginStore['isPluginExists'];
  getBuilderConfig: () => BuilderConfig;

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

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
