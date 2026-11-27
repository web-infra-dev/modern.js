export { createBridgeComponent } from '@module-federation/bridge-react/server';
export { createModernBridgeComponent } from './mf/provider.node';
export { render, hydrate, renderStream } from './mf/callbacks.node';
export type { ModernBridgeComponentOptions } from './mf/types';
export {
  createReactRemote,
  ReactRemote,
  createModernReactRemote,
  useRemoteBasename,
} from './mf/remote.node';
export type {
  CreateReactRemoteOptions,
  ReactRemoteProps,
  ReactRemoteErrorInfo,
  CreateReactRemote,
  ReactRemoteComponent,
  RemoteSource,
  RemoteExportName,
  InferRemoteProps,
  BridgeProvider,
} from '@module-federation/bridge-react/base';

export { MemoryRouteProvider, useMemoryRoute } from './router/runtime/memory';
export type {
  MemoryRouteEntry,
  MemoryRouteProviderProps,
  MemoryRouteState,
  MemoryRouterConfig,
  MemoryRouterOptions,
} from './router/runtime/memory';

export { shouldUpdateRemote, updateRemotes } from './mf/update';
export type {
  RemoteUpdateTarget,
  RemoteUpdateOptions,
  RemoteUpdateReceipt,
  RemoteUpdateResult,
} from './mf/update';
