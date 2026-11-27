import type { ModuleFederation } from '@module-federation/enhanced/runtime';

export type GlobalModuleInfo = Record<
  string,
  Record<string, unknown> | undefined
>;

export const DYNAMIC_ROUTE_SYMBOL = Symbol.for(
  'modern-js.router.dynamic-route',
);

export const APPLICATIONS_DATA_SCRIPT_ID = '__MODERN_APPLICATIONS_DATA__';

export const INTERNAL_MOUNT_ID_KEY = '__modern_mf_mount_id__';
export const INTERNAL_CONSUMER_KEY = '__modern_mf_consumer__';
export const INTERNAL_STORE_KEY = '__modern_mf_applications_store__';

export interface RemoteRoute {
  route: string;
  moduleName: string;
  expose: string;
  versionOrUrl: string;
  discoverChildren: boolean;
  props?: Record<string, unknown>;
  /**
   * Optional rendering protocol hint passed to `createModernReactRemote`.
   * Required only for legacy producers (e.g. older Bridge/Vmok builds) whose
   * manifest does not emit `exposes[i].render` metadata.
   */
  render?: 'bridge' | 'component';
}

export type ApplicationRef = Pick<
  RemoteRoute,
  'moduleName' | 'expose' | 'versionOrUrl'
>;

export interface DiscoveryContext {
  consumer: ApplicationRef | null;
  pathname: string;
  search: string;
  basename: string;
  mountId: string;
  parentMountId?: string;
  transactionId: string;
  signal: AbortSignal;
  /** Present during Node SSR requests only; never serialized to the browser. */
  request?: Request;
}

export interface ApplicationsLoadResult {
  routes: RemoteRoute[];
  moduleInfo?: GlobalModuleInfo;
}

export type LoadApplications = (
  ctx: DiscoveryContext,
) => Promise<ApplicationsLoadResult> | ApplicationsLoadResult;

export interface SnapshotExpiredEvent {
  reason: string;
  error: Error;
  source?: string;
  expectedSid?: string;
  receivedSid?: string;
  pathname: string;
  search: string;
  mountId: string;
  consumer: ApplicationRef | null;
  reloadCount: number;
}

export type OnSnapshotExpired = (
  event: SnapshotExpiredEvent,
) => 'reload' | 'defer' | Promise<'reload' | 'defer'>;

export interface ApplicationsLifecycle {
  onCommit?: (transactionId: string) => void;
  onDiscard?: (transactionId: string, reason?: unknown) => void;
  dehydrate?: () => unknown;
  hydrate?: (state: unknown) => void;
}

export interface ApplicationsHooksModule {
  default?: LoadApplications;
  load?: LoadApplications;
  onSnapshotExpired?: OnSnapshotExpired;
  lifecycle?: ApplicationsLifecycle;
  onCommit?: ApplicationsLifecycle['onCommit'];
  onDiscard?: ApplicationsLifecycle['onDiscard'];
  dehydrate?: ApplicationsLifecycle['dehydrate'];
  hydrate?: ApplicationsLifecycle['hydrate'];
}

export interface DiscoverApplicationsOptions {
  pathname?: string;
  search?: string;
  cache?: 'default' | 'reload';
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface DiscoveredContext {
  mountId: string;
  parentMountId?: string;
  consumer: ApplicationRef | null;
  basename: string;
  routes: readonly RemoteRoute[];
  matchedRoute?: RemoteRoute;
}

export interface DiscoverApplicationsResult {
  target: {
    pathname: string;
    search: string;
  };
  contexts: readonly DiscoveredContext[];
}

export interface ApplicationsService {
  discoverApplications(
    options?: DiscoverApplicationsOptions,
  ): Promise<DiscoverApplicationsResult>;
  getRoutesForMount(mountId: string): readonly RemoteRoute[];
  getMountContext(mountId: string): DiscoveredContext | undefined;
}

export interface SerializedApplicationsState {
  version: 1;
  target: {
    pathname: string;
    search: string;
  };
  contexts: Array<{
    mountId: string;
    parentMountId?: string;
    consumer: ApplicationRef | null;
    basename: string;
    routes: RemoteRoute[];
    matchedRoute?: RemoteRoute;
  }>;
  moduleInfo?: GlobalModuleInfo;
  lifecycleState?: unknown;
}

export interface DiscoveryDiagnostic {
  target: string;
  consumer: ApplicationRef | null;
  mountId: string;
  depth: number;
  hookCalls: number;
  durationMs: number;
  outcome:
    'committed' | 'cached' | 'aborted' | 'expired' | 'deferred' | 'error';
  reason?: string;
}

export interface ApplicationsStoreOptions {
  hooks?: ApplicationsHooksModule;
  autoGenerateRoute?: boolean;
  isBrowser: boolean;
  rootBasename?: string;
  maxDepth?: number;
  timeoutMs?: number;
  maxReloads?: number;
  reloadWindowMs?: number;
  getInstance?: () => ModuleFederation | null | undefined;
  reloadPage?: () => void;
  getLocation?: () => { pathname: string; search: string };
  request?: Request;
  onDiagnostic?: (diagnostic: DiscoveryDiagnostic) => void;
}
