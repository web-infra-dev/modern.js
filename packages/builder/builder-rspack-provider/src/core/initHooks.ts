import {
  createAsyncHook,
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
} from '@modern-js/builder-shared';
import type {
  ModifyRspackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
  BuilderConfig,
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
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn<BuilderConfig>>(),
    modifyRspackConfigHook: createAsyncHook<ModifyRspackConfigFn>(),
    modifyBuilderConfigHook: createAsyncHook<ModifyBuilderConfigFn>(),
    onAfterCreateCompilerHook: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHook: createAsyncHook<OnBeforeCreateCompilerFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
