import type React from 'react';
import type { AsyncInterruptHook, CollectSyncHook, SyncHook } from '../hooks';

export type OnBeforeRenderFn<RuntimeContext> = (
  context: RuntimeContext,
  interrupt: (info: any) => any,
) => Promise<any> | any;

export type WrapRootFn = (
  root: React.ComponentType<any>,
) => React.ComponentType<any>;

export type PickContextFn<RuntimeContext> = (
  context: RuntimeContext,
) => RuntimeContext;

export type ModifyRuntimeConfigFn<RuntimeConfig> = (
  config: RuntimeConfig,
) => RuntimeConfig;

export type Hooks<RuntimeConfig, RuntimeContext> = {
  onBeforeRender: AsyncInterruptHook<OnBeforeRenderFn<RuntimeContext>>;
  wrapRoot: SyncHook<WrapRootFn>;
  pickContext: SyncHook<PickContextFn<RuntimeContext>>;
  modifyRuntimeConfig: CollectSyncHook<ModifyRuntimeConfigFn<RuntimeConfig>>;
};
