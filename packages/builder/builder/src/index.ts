export { createBuilder } from './createBuilder';
export { mergeBuilderConfig } from '@modern-js/builder-shared';

export { builderPluginSourceBuild } from './plugins/sourceBuild';

export type {
  BuilderMode,
  BuilderEntry,
  BuilderTarget,
  BuilderPlugin,
  BuilderContext,
  BuilderInstance,
  CreateBuilderOptions,
  InspectConfigOptions,

  // Hook Callback Types
  OnExitFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnBeforeBuildFn,
  OnBeforeStartDevServerFn,
  OnBeforeCreateCompilerFn,
  OnDevCompileDoneFn,
  ModifyBuilderConfigFn,
} from '@modern-js/builder-shared';
