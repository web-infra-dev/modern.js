import type {
  BuilderContext,
  PluginStore,
  BuilderPlugin as BaseBuilderPlugin,
} from '@modern-js/builder-shared';
import type { BuilderConfig, NormalizedConfig } from './config';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyRspackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
} from './hooks';

export type BuilderPluginAPI = {
  context: Readonly<BuilderContext>;
  isPluginExists: PluginStore['isPluginExists'];
  /**
   * Get the relative paths of generated HTML files.
   * The key is entry name and the value is path.
   */
  getHTMLPaths: () => Record<string, string>;
  getBuilderConfig: () => Readonly<BuilderConfig>;
  getNormalizedConfig: () => Readonly<NormalizedConfig>;

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
  modifyRspackConfig: (fn: ModifyRspackConfigFn) => void;
  modifyBuilderConfig: (fn: ModifyBuilderConfigFn) => void;
};

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
