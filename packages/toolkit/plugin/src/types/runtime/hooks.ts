export type HandleRequestConfig = Record<string, any>;
export type ChunkSet = {
  renderLevel: any;
  ssrScripts: string;
  jsChunk: string;
  cssChunk: string;
};
export type Collector = {
  collect?: (component: React.ReactElement) => React.ReactElement;
  effect: () => void | Promise<void>;
};
import type React from 'react';
import type { AsyncInterruptHook, CollectSyncHook, SyncHook } from '../hooks';

export type OnBeforeRenderFn<RuntimeContext> = (
  context: RuntimeContext,
  interrupt: (info: any) => any,
) => Promise<any> | any;

export type ExtendStringSSRCollectorsFn<RuntimeContext> = (
  context: RuntimeContext,
) => Collector;

export type StringSSRCollectorsInfo = {
  chunkSet: ChunkSet;
};

export type WrapRootFn = (
  root: React.ComponentType<any>,
) => React.ComponentType<any>;

export type PickContextFn<RuntimeContext> = (
  context: RuntimeContext,
) => RuntimeContext;

export type ConfigFn<RuntimeConfig> = () => RuntimeConfig;

export type Hooks<RuntimeConfig, RuntimeContext> = {
  onBeforeRender: AsyncInterruptHook<OnBeforeRenderFn<RuntimeContext>>;
  wrapRoot: SyncHook<WrapRootFn>;
  pickContext: SyncHook<PickContextFn<RuntimeContext>>;
  config: CollectSyncHook<ConfigFn<RuntimeConfig>>;
  extendStringSSRCollectors: CollectSyncHook<
    ExtendStringSSRCollectorsFn<StringSSRCollectorsInfo>
  >;
};
