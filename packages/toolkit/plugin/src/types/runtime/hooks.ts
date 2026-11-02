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

export interface StreamSSRExtender {
  init?: (params: {
    rootElement: React.ReactElement;
    forceStream2String: boolean;
    /** Existing shell boundary, shared by all stream extenders. */
    shellEndMarker?: string;
    identifierPrefix?: string;
    request?: Request;
    nonce?: string;
    runtimeContext?: {
      ssrContext?: {
        nonce?: string;
        onError?: (error: unknown, key?: string) => void;
        request: { url: string; raw?: Request; headers?: unknown };
      };
      [key: string]: unknown;
    };
  }) => void;

  modifyRootElement?: (rootElement: React.ReactElement) => React.ReactElement;

  getStyleTags?: () => string;

  /** Initial receiver markup, emitted before async entry scripts and stream messages. */
  getBootstrapScripts?: () => string;

  processStream?: (stream: NodeJS.ReadWriteStream) => NodeJS.ReadWriteStream;

  /** Release work when the shell fails, the request aborts, or output is cancelled. */
  abort?: (reason?: unknown) => void;
}

export type ExtendStreamSSRFn = () => StreamSSRExtender;

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
  extendStreamSSR: CollectSyncHook<ExtendStreamSSRFn>;
};
