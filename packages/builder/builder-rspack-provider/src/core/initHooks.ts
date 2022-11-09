import { createAsyncHook } from '@modern-js/builder-shared';
import type {
  OnExitFn,
  OnBeforeBuildFn,
  OnAfterBuildFn,
  OnDevCompileDoneFn,
  ModifyBuilderConfigFn,
  ModifyRspackConfigFn,
  OnBeforeCreateCompilerFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
} from '../types';

export function initHooks() {
  return {
    onExitHook: createAsyncHook<OnExitFn>(),
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    modifyRspackConfigHook: createAsyncHook<ModifyRspackConfigFn>(),
    modifyBuilderConfigHook: createAsyncHook<ModifyBuilderConfigFn>(),
    onBeforeCreateCompilerHooks: createAsyncHook<OnBeforeCreateCompilerFn>(),
    onAfterStartDevServerHooks: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHooks: createAsyncHook<OnBeforeStartDevServerFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
