import {
  createAsyncHook,
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyBuilderConfigFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
} from '@modern-js/builder-shared';
import type {
  Compiler,
  RspackConfig,
  BuilderConfig,
  ModifyRspackConfigFn,
} from '../types';

export function initHooks() {
  return {
    /** parameters are not bundler-related */
    onExitHook: createAsyncHook<OnExitFn>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    onAfterStartDevServerHook: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHook: createAsyncHook<OnBeforeStartDevServerFn>(),

    /** parameters are bundler-related */
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn<RspackConfig>>(),
    modifyRspackConfigHook: createAsyncHook<ModifyRspackConfigFn>(),
    modifyBuilderConfigHook:
      createAsyncHook<ModifyBuilderConfigFn<BuilderConfig>>(),
    onAfterCreateCompilerHook:
      createAsyncHook<OnAfterCreateCompilerFn<Compiler>>(),
    onBeforeCreateCompilerHook:
      createAsyncHook<OnBeforeCreateCompilerFn<RspackConfig>>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
