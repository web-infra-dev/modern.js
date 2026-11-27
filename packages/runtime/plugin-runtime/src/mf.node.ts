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

export { shouldUpdateRemote, updateRemotes } from './mf/update';
export type {
  RemoteUpdateTarget,
  RemoteUpdateOptions,
  RemoteUpdateReceipt,
  RemoteUpdateResult,
} from './mf/update';

export { useApplications } from './mf/applications/context';
export {
  createSnapshotExpiredError,
  isSnapshotExpiredError,
  SnapshotExpiredError,
  ApplicationsDiscoveryError,
  SNAPSHOT_EXPIRED_CODE,
} from './mf/applications/errors';
export {
  createApplicationsStore,
  getDynamicServiceRemotes,
  type ApplicationsStore,
  type DynamicServiceRemoteRecord,
} from './mf/applications/store';
export {
  mfApplicationsPlugin,
  type ApplicationsRuntimePluginConfig,
} from './mf/applications/plugin.node';
export type {
  GlobalModuleInfo,
  RemoteRoute,
  ApplicationRef,
  DiscoveryContext,
  ApplicationsLoadResult,
  LoadApplications,
  SnapshotExpiredEvent,
  OnSnapshotExpired,
  ApplicationsLifecycle,
  ApplicationsHooksModule,
  DiscoverApplicationsOptions,
  DiscoveredContext,
  DiscoverApplicationsResult,
  ApplicationsService,
  SerializedApplicationsState,
  DiscoveryDiagnostic,
  ApplicationsStoreOptions,
} from './mf/applications/types';
