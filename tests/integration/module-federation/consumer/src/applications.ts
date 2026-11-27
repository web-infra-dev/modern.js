import { getInstance, helpers } from '@module-federation/enhanced/runtime';
import {
  createSnapshotExpiredError,
  type ApplicationsLoadResult,
  type DiscoveryContext,
  type GlobalModuleInfo,
  type RemoteRoute,
  type SnapshotExpiredEvent,
} from '@modern-js/runtime/mf';

const SNAPSHOT_EXPIRED_CODE = 'MODERN_APPLICATIONS_SNAPSHOT_EXPIRED';
const EXPIRED_POLICY_KEY = 'mf-lab-apps-expired-policy';

interface ChildSourceRef {
  source: string;
  deploymentId?: string;
  producerManifestUrl: string;
  moduleName: string;
  expose: string;
  route: string;
}

interface DeploymentPayload {
  version: 1;
  consumer: string;
  consumerManifestUrl?: string;
  sid?: string;
  deliveryMode?: 'full' | 'layered';
  partialRoot?: boolean;
  pathClipped?: boolean;
  routes: RemoteRoute[];
  moduleInfo: GlobalModuleInfo;
  sources?: Record<string, ChildSourceRef>;
  fixedChildren?: Record<string, DeploymentPayload>;
  bundledChildren?: Record<string, DeploymentPayload>;
}

interface MountRecord {
  source: string;
  deploymentId?: string;
  deliveryMode: 'full' | 'layered';
  pathClipped: boolean;
  sources: Record<string, ChildSourceRef>;
  fixedChildren?: Record<string, DeploymentPayload>;
  bundledChildren?: Record<string, DeploymentPayload>;
  cachedSnapshot?: DeploymentPayload;
}

export interface ClientTraceEntry {
  id: string;
  time: string;
  env: 'browser' | 'ssr';
  pathname: string;
  basename: string;
  mountId: string;
  consumer: string;
  source: string;
  deliveryMode: string;
  pathClipped: boolean;
  fetchKind: 'http' | 'bundled-memory' | 'fixed-memory' | 'root-cache';
  sid?: string;
  durationMs: number;
  routes: string[];
  moduleInfoKeys: string[];
  error?: string;
}

export interface ClientRuntimeTelemetry {
  hydratedFromSSR: boolean;
  expiredEvent?: {
    message: string;
    source?: string;
    expectedSid?: string;
    receivedSid?: string;
    action: 'reload' | 'defer';
    time: string;
  };
  acceptedSids: Record<string, string>;
  registeredRemotes: Array<{ name: string; entry?: string; version?: string }>;
  globalSnapshotKeys: string[];
  traces: ClientTraceEntry[];
}

function normalizeExpose(expose: string): string {
  const trimmed = expose.trim();
  if (!trimmed || trimmed === '.') return '.';
  return trimmed.startsWith('./')
    ? trimmed
    : `./${trimmed.replace(/^\/+/, '')}`;
}

function childSourceKey(
  moduleName: string,
  expose: string,
  versionOrUrl: string,
): string {
  return `${moduleName}::${normalizeExpose(expose)}::${versionOrUrl}`;
}

function apiBase(): string {
  return (
    process.env.MF_LAB_API ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:4306')
  );
}

const acceptedSids = new Map<string, string>();
const committedMounts = new Map<string, MountRecord>();
const stagedMounts = new Map<string, Map<string, MountRecord>>();
const stagedSids = new Map<string, Map<string, string>>();
const traces: ClientTraceEntry[] = [];
let hydratedFromSSR = false;
let lastExpiredEvent: ClientRuntimeTelemetry['expiredEvent'];
let forceNextNetworkFetch = false;

const traceListeners = new Set<() => void>();

export function markForceNetworkReload(): void {
  forceNextNetworkFetch = true;
}

export function clearClientTraces(): void {
  traces.length = 0;
  lastExpiredEvent = undefined;
  emitTelemetry();
}

export function getExpiredPolicy(): 'reload' | 'defer' {
  if (typeof window === 'undefined') return 'reload';
  try {
    return window.sessionStorage.getItem(EXPIRED_POLICY_KEY) === 'defer'
      ? 'defer'
      : 'reload';
  } catch {
    return 'reload';
  }
}

export function setExpiredPolicy(policy: 'reload' | 'defer'): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(EXPIRED_POLICY_KEY, policy);
  } catch {
    // ignore storage errors
  }
}

export function subscribeTelemetry(listener: () => void): () => void {
  traceListeners.add(listener);
  return () => {
    traceListeners.delete(listener);
  };
}

export function getClientTelemetry(): ClientRuntimeTelemetry {
  const instance = getInstance();
  const registeredRemotes = (instance?.options?.remotes || []).map(remote => ({
    name: remote.name,
    ...('entry' in remote && remote.entry ? { entry: remote.entry } : {}),
    ...('version' in remote && remote.version
      ? { version: remote.version }
      : {}),
  }));
  let globalSnapshotKeys: string[] = [];
  try {
    globalSnapshotKeys = Object.keys(helpers.global.getGlobalSnapshot() || {});
  } catch {
    globalSnapshotKeys = [];
  }
  return {
    hydratedFromSSR,
    expiredEvent: lastExpiredEvent,
    acceptedSids: Object.fromEntries(acceptedSids.entries()),
    registeredRemotes,
    globalSnapshotKeys,
    traces: [...traces],
  };
}

export function emitTelemetry(): void {
  if (typeof window === 'undefined') return;
  const snapshot = getClientTelemetry();
  (window as unknown as Record<string, unknown>).__MF_LAB_APPS_TRACE__ =
    snapshot;
  for (const listener of traceListeners) {
    try {
      listener();
    } catch {
      // ignore listener errors
    }
  }
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'mf-lab-apps-trace',
          pathname: window.location.pathname,
          search: window.location.search,
          telemetry: snapshot,
        },
        '*',
      );
    }
  } catch {
    // ignore cross-origin postMessage errors
  }
}

const isBrowserEnv = () => typeof window !== 'undefined';

function getMountRecord(
  mountId: string,
  transactionId?: string,
): MountRecord | undefined {
  if (transactionId) {
    const staged = stagedMounts.get(transactionId)?.get(mountId);
    if (staged) return staged;
  }
  return isBrowserEnv() ? committedMounts.get(mountId) : undefined;
}

function getAcceptedSid(
  source: string,
  transactionId?: string,
): string | undefined {
  if (isBrowserEnv()) {
    const committed = acceptedSids.get(source);
    if (committed !== undefined) return committed;
  }
  if (transactionId) {
    return stagedSids.get(transactionId)?.get(source);
  }
  return undefined;
}

function stageMountRecord(
  mountId: string,
  record: MountRecord,
  sid: string | undefined,
  transactionId?: string,
): void {
  if (!transactionId) {
    committedMounts.set(mountId, record);
    if (sid !== undefined) acceptedSids.set(record.source, sid);
    return;
  }
  let txMounts = stagedMounts.get(transactionId);
  if (!txMounts) {
    txMounts = new Map();
    stagedMounts.set(transactionId, txMounts);
  }
  txMounts.set(mountId, record);
  if (sid !== undefined) {
    let txSids = stagedSids.get(transactionId);
    if (!txSids) {
      txSids = new Map();
      stagedSids.set(transactionId, txSids);
    }
    txSids.set(record.source, sid);
  }
}

async function fetchPlatformDeployment(params: {
  source: string;
  pathname: string;
  basename: string;
  expectedSid?: string;
  deploymentId?: string;
  signal?: AbortSignal;
}): Promise<DeploymentPayload> {
  const query = new URLSearchParams({
    source: params.source,
    pathname: params.pathname,
    basename: params.basename,
    env: typeof window === 'undefined' ? 'ssr' : 'browser',
  });
  if (params.expectedSid) query.set('expectedSid', params.expectedSid);
  if (params.deploymentId) query.set('deploymentId', params.deploymentId);

  const response = await fetch(
    `${apiBase()}/_lab/deployments/discover?${query}`,
    {
      signal: params.signal,
      cache: 'no-store',
    },
  );
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (response.status === 409 || body.code === SNAPSHOT_EXPIRED_CODE) {
    throw createSnapshotExpiredError(
      typeof body.error === 'string'
        ? body.error
        : `Deployment snapshot expired for "${params.source}".`,
      {
        source: typeof body.source === 'string' ? body.source : params.source,
        expectedSid:
          typeof body.expectedSid === 'string'
            ? body.expectedSid
            : params.expectedSid,
        receivedSid:
          typeof body.receivedSid === 'string' ? body.receivedSid : undefined,
      },
    );
  }

  if (!response.ok) {
    throw new Error(
      typeof body.error === 'string'
        ? body.error
        : `Discovery request failed with HTTP ${response.status}.`,
    );
  }

  return body as unknown as DeploymentPayload;
}

function recordTrace(entry: ClientTraceEntry): void {
  traces.unshift(entry);
  if (traces.length > 60) traces.length = 60;
  emitTelemetry();
}

export default async function load(
  ctx: DiscoveryContext,
): Promise<ApplicationsLoadResult> {
  const started = Date.now();
  const isBrowser = typeof window !== 'undefined';
  const env = isBrowser ? 'browser' : 'ssr';

  // Root layer discovery
  if (!ctx.consumer) {
    if (!isBrowser) {
      traces.length = 0;
    }
    const forceHttp = forceNextNetworkFetch;
    forceNextNetworkFetch = false;

    const existingRoot = isBrowser
      ? committedMounts.get(ctx.mountId)
      : undefined;
    if (
      isBrowser &&
      !forceHttp &&
      existingRoot?.cachedSnapshot &&
      !existingRoot.pathClipped
    ) {
      const snap = existingRoot.cachedSnapshot;
      stageMountRecord(ctx.mountId, existingRoot, snap.sid, ctx.transactionId);
      recordTrace({
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: new Date().toISOString(),
        env,
        pathname: ctx.pathname,
        basename: ctx.basename,
        mountId: ctx.mountId,
        consumer: 'portal (root)',
        source: 'portal',
        deliveryMode: existingRoot.deliveryMode,
        pathClipped: false,
        fetchKind: 'root-cache',
        sid: snap.sid,
        durationMs: Date.now() - started,
        routes: snap.routes.map(r => `${r.route} -> ${r.moduleName}`),
        moduleInfoKeys: Object.keys(snap.moduleInfo || {}),
      });
      return {
        routes: snap.routes,
        moduleInfo: snap.moduleInfo,
      };
    }

    const expectedSid = getAcceptedSid('portal', ctx.transactionId);
    try {
      const snap = await fetchPlatformDeployment({
        source: 'portal',
        pathname: ctx.pathname,
        basename: ctx.basename,
        expectedSid,
        signal: ctx.signal,
      });

      const deliveryMode = snap.deliveryMode || 'layered';
      const pathClipped = Boolean(snap.partialRoot || snap.pathClipped);
      stageMountRecord(
        ctx.mountId,
        {
          source: 'portal',
          deliveryMode,
          pathClipped,
          sources: snap.sources || {},
          fixedChildren: snap.fixedChildren,
          bundledChildren: snap.bundledChildren,
          cachedSnapshot: pathClipped ? undefined : snap,
        },
        snap.sid,
        ctx.transactionId,
      );

      recordTrace({
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: new Date().toISOString(),
        env,
        pathname: ctx.pathname,
        basename: ctx.basename,
        mountId: ctx.mountId,
        consumer: 'portal (root)',
        source: 'portal',
        deliveryMode,
        pathClipped,
        fetchKind: 'http',
        sid: snap.sid,
        durationMs: Date.now() - started,
        routes: snap.routes.map(r => `${r.route} -> ${r.moduleName}`),
        moduleInfoKeys: Object.keys(snap.moduleInfo || {}),
      });

      return {
        routes: snap.routes,
        moduleInfo: snap.moduleInfo,
      };
    } catch (error) {
      recordTrace({
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: new Date().toISOString(),
        env,
        pathname: ctx.pathname,
        basename: ctx.basename,
        mountId: ctx.mountId,
        consumer: 'portal (root)',
        source: 'portal',
        deliveryMode: existingRoot?.deliveryMode || 'unknown',
        pathClipped: Boolean(existingRoot?.pathClipped),
        fetchKind: 'http',
        durationMs: Date.now() - started,
        routes: [],
        moduleInfoKeys: [],
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Child layer discovery
  const parentRecord = ctx.parentMountId
    ? getMountRecord(ctx.parentMountId, ctx.transactionId)
    : undefined;
  if (!parentRecord) {
    throw new Error(
      `No deployment source context found for parent mount "${ctx.parentMountId ?? ''}".`,
    );
  }
  const key = childSourceKey(
    ctx.consumer.moduleName,
    ctx.consumer.expose,
    ctx.consumer.versionOrUrl,
  );
  const childRef = parentRecord.sources[key];
  if (!childRef) {
    throw new Error(
      `Unknown child deployment source for "${ctx.consumer.moduleName}" (${ctx.consumer.expose}).`,
    );
  }

  // 1) Fixed child deployment (pinned snapshot embedded in parent)
  const fixedSnap = parentRecord.fixedChildren?.[key];
  if (fixedSnap) {
    stageMountRecord(
      ctx.mountId,
      {
        source: childRef.source,
        deploymentId: childRef.deploymentId,
        deliveryMode: parentRecord.deliveryMode,
        pathClipped: false,
        sources: fixedSnap.sources || {},
        fixedChildren: fixedSnap.fixedChildren,
        bundledChildren: fixedSnap.bundledChildren,
      },
      undefined,
      ctx.transactionId,
    );
    recordTrace({
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toISOString(),
      env,
      pathname: ctx.pathname,
      basename: ctx.basename,
      mountId: ctx.mountId,
      consumer: `${ctx.consumer.moduleName} (${ctx.consumer.expose})`,
      source: childRef.source,
      deliveryMode: 'fixed-snapshot',
      pathClipped: false,
      fetchKind: 'fixed-memory',
      sid: fixedSnap.sid,
      durationMs: Date.now() - started,
      routes: fixedSnap.routes.map(r => `${r.route} -> ${r.moduleName}`),
      moduleInfoKeys: Object.keys(fixedSnap.moduleInfo || {}),
    });
    return {
      routes: fixedSnap.routes,
      moduleInfo: fixedSnap.moduleInfo,
    };
  }

  // 2) Full-delivery pre-bundled child snapshot (0 extra HTTP fetch)
  const bundledSnap = parentRecord.bundledChildren?.[key];
  if (bundledSnap && !forceNextNetworkFetch) {
    const expectedSid = getAcceptedSid(childRef.source, ctx.transactionId);
    if (expectedSid && bundledSnap.sid && expectedSid !== bundledSnap.sid) {
      throw createSnapshotExpiredError(
        `Child source "${childRef.source}" expired: expected "${expectedSid}", got "${bundledSnap.sid}".`,
        {
          source: childRef.source,
          expectedSid,
          receivedSid: bundledSnap.sid,
        },
      );
    }
    stageMountRecord(
      ctx.mountId,
      {
        source: childRef.source,
        deliveryMode: 'full',
        pathClipped: false,
        sources: bundledSnap.sources || {},
        fixedChildren: bundledSnap.fixedChildren,
        bundledChildren: bundledSnap.bundledChildren,
      },
      bundledSnap.sid,
      ctx.transactionId,
    );
    recordTrace({
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toISOString(),
      env,
      pathname: ctx.pathname,
      basename: ctx.basename,
      mountId: ctx.mountId,
      consumer: `${ctx.consumer.moduleName} (${ctx.consumer.expose})`,
      source: childRef.source,
      deliveryMode: 'full',
      pathClipped: false,
      fetchKind: 'bundled-memory',
      sid: bundledSnap.sid,
      durationMs: Date.now() - started,
      routes: bundledSnap.routes.map(r => `${r.route} -> ${r.moduleName}`),
      moduleInfoKeys: Object.keys(bundledSnap.moduleInfo || {}),
    });
    return {
      routes: bundledSnap.routes,
      moduleInfo: bundledSnap.moduleInfo,
    };
  }

  // 3) Layered delivery: fetch child source over HTTP on demand
  const expectedChildSid = getAcceptedSid(childRef.source, ctx.transactionId);
  try {
    const childSnap = await fetchPlatformDeployment({
      source: childRef.source,
      pathname: ctx.pathname,
      basename: ctx.basename,
      deploymentId: childRef.deploymentId,
      expectedSid: expectedChildSid,
      signal: ctx.signal,
    });

    stageMountRecord(
      ctx.mountId,
      {
        source: childRef.source,
        deploymentId: childRef.deploymentId,
        deliveryMode: 'layered',
        pathClipped: Boolean(childSnap.pathClipped),
        sources: childSnap.sources || {},
        fixedChildren: childSnap.fixedChildren,
        bundledChildren: childSnap.bundledChildren,
      },
      childSnap.sid,
      ctx.transactionId,
    );

    recordTrace({
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toISOString(),
      env,
      pathname: ctx.pathname,
      basename: ctx.basename,
      mountId: ctx.mountId,
      consumer: `${ctx.consumer.moduleName} (${ctx.consumer.expose})`,
      source: childRef.source,
      deliveryMode: 'layered',
      pathClipped: Boolean(childSnap.pathClipped),
      fetchKind: 'http',
      sid: childSnap.sid,
      durationMs: Date.now() - started,
      routes: childSnap.routes.map(r => `${r.route} -> ${r.moduleName}`),
      moduleInfoKeys: Object.keys(childSnap.moduleInfo || {}),
    });

    return {
      routes: childSnap.routes,
      moduleInfo: childSnap.moduleInfo,
    };
  } catch (error) {
    recordTrace({
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toISOString(),
      env,
      pathname: ctx.pathname,
      basename: ctx.basename,
      mountId: ctx.mountId,
      consumer: `${ctx.consumer.moduleName} (${ctx.consumer.expose})`,
      source: childRef.source,
      deliveryMode: 'layered',
      pathClipped: false,
      fetchKind: 'http',
      durationMs: Date.now() - started,
      routes: [],
      moduleInfoKeys: [],
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export const lifecycle = {
  onCommit(transactionId: string) {
    if (!isBrowserEnv()) {
      // Each Node SSR request replaces the active dehydration snapshot cleanly
      // without leaking stale state across subsequent SSR requests.
      committedMounts.clear();
      acceptedSids.clear();
    }
    const txMounts = stagedMounts.get(transactionId);
    if (txMounts) {
      for (const [mountId, record] of txMounts) {
        committedMounts.set(mountId, record);
      }
      stagedMounts.delete(transactionId);
    }
    const txSids = stagedSids.get(transactionId);
    if (txSids) {
      for (const [source, sid] of txSids) {
        acceptedSids.set(source, sid);
      }
      stagedSids.delete(transactionId);
    }
    emitTelemetry();
  },

  onDiscard(transactionId: string) {
    stagedMounts.delete(transactionId);
    stagedSids.delete(transactionId);
    emitTelemetry();
  },

  dehydrate() {
    return {
      version: 1,
      acceptedSids: Object.fromEntries(acceptedSids.entries()),
      mounts: Object.fromEntries(committedMounts.entries()),
      ssrTraces: traces.slice(0, 10),
    };
  },

  hydrate(state: unknown) {
    if (!state || typeof state !== 'object') return;
    const data = state as {
      version?: number;
      acceptedSids?: Record<string, string>;
      mounts?: Record<string, MountRecord>;
      ssrTraces?: ClientTraceEntry[];
    };
    if (data.version !== 1) return;
    hydratedFromSSR = true;
    acceptedSids.clear();
    committedMounts.clear();
    if (data.acceptedSids) {
      for (const [source, sid] of Object.entries(data.acceptedSids)) {
        acceptedSids.set(source, sid);
      }
    }
    if (data.mounts) {
      for (const [mountId, record] of Object.entries(data.mounts)) {
        committedMounts.set(mountId, record);
      }
    }
    if (Array.isArray(data.ssrTraces)) {
      traces.splice(0, traces.length, ...data.ssrTraces);
    }
    emitTelemetry();
  },
};

export async function onSnapshotExpired(
  event: SnapshotExpiredEvent,
): Promise<'reload' | 'defer'> {
  const policy = getExpiredPolicy();
  lastExpiredEvent = {
    message: event.error.message,
    source: event.source,
    expectedSid: event.expectedSid,
    receivedSid: event.receivedSid,
    action: policy,
    time: new Date().toISOString(),
  };
  emitTelemetry();
  return policy;
}
