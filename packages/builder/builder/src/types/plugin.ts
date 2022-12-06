import type {
  BuilderPlugin as BaseBuilderPlugin,
  BuilderContext,
} from '@modern-js/builder-shared';
import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
} from './hooks';
import type { CommonBuilderConfig, CommonNormalizedConfig } from './config';

/**
 * Define a generic builder plugin API that provider can extend as needed.
 */
export type BuilderPluginAPI<
  Config extends CommonBuilderConfig = CommonBuilderConfig,
> = {
  context: Readonly<BuilderContext>;

  onExit: (fn: OnExitFn) => void;
  onAfterBuild: (fn: OnAfterBuildFn) => void;
  onBeforeBuild: (fn: OnBeforeBuildFn) => void;
  onDevCompileDone: (fn: OnDevCompileDoneFn) => void;
  onAfterStartDevServer: (fn: OnAfterStartDevServerFn) => void;
  onBeforeStartDevServer: (fn: OnBeforeStartDevServerFn) => void;

  getBuilderConfig: () => Readonly<Config>;
  getNormalizedConfig: () => Readonly<CommonNormalizedConfig>;
};

export type BuilderPlugin = BaseBuilderPlugin<BuilderPluginAPI>;
