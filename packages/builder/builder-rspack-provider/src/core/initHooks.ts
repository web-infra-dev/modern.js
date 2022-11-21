import { createAsyncHook } from '@modern-js/builder-shared';
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
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn>(),
    modifyRspackConfigHook: createAsyncHook<ModifyRspackConfigFn>(),
    modifyBuilderConfigHook: createAsyncHook<ModifyBuilderConfigFn>(),
    onAfterCreateCompilerHook: createAsyncHook<OnAfterCreateCompilerFn>(),
    onBeforeCreateCompilerHook: createAsyncHook<OnBeforeCreateCompilerFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
