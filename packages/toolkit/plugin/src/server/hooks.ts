import { createAsyncHook } from '../hooks';
import type {
  ModifyConfigFn,
  OnPrepareFn,
  OnResetFn,
} from '../types/server/hooks';
import type { DeepPartial } from '../types/utils';

export type { OnResetFn, OnPrepareFn, ModifyConfigFn };

export function initHooks<Config>() {
  return {
    modifyConfig: createAsyncHook<ModifyConfigFn<DeepPartial<Config>>>(),
    onPrepare: createAsyncHook<OnPrepareFn>(),
    onReset: createAsyncHook<OnResetFn>(),
  };
}

export type Hooks<Config> = ReturnType<typeof initHooks<Config>>;
