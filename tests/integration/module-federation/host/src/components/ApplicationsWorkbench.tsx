import { useSearchParams } from '@modern-js/runtime/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LabLayout } from './LabLayout';
import './ApplicationsWorkbench.css';

interface PlatformAppConfig {
  id: string;
  title: string;
  enabled: boolean;
  route: string;
  sourceKind?: 'registry' | 'url';
  producerName?: string;
  version?: string;
  manifestUrl: string;
  expose: string;
  /** Optional render protocol hint for legacy producers lacking manifest render metadata. */
  render?: 'bridge' | 'component';
  childrenMode: 'dynamic' | 'none';
  childrenSource?: string;
  childrenDelivery?: 'full' | 'layered';
  props?: Record<string, string>;
}

interface RegistryProducer {
  name: string;
  versions: Array<{ version: string; manifestUrl: string }>;
}

interface InspectedManifest {
  manifestUrl: string;
  name: string;
  buildVersion?: string;
  exposes: Array<{ path: string; name: string; render?: string }>;
}

interface PortalPlatformConfig {
  consumer: string;
  applications: PlatformAppConfig[];
}

interface ChildPlatformConfig {
  consumer: string;
  consumerManifestUrl?: string;
  applications: PlatformAppConfig[];
}

interface PlatformStateResponse {
  computedDelivery: {
    mode: 'full' | 'layered';
    hasNestedChildren: boolean;
  };
  registry: RegistryProducer[];
  presets: {
    providerV1: string;
    providerV2?: string;
    nested?: string;
    consumerOrigin?: string;
  };
  sources: {
    portal: {
      config: PortalPlatformConfig;
      active: {
        sid: string;
        deliveryMode: 'full' | 'layered';
        routes: Array<{
          route: string;
          moduleName: string;
          expose: string;
          versionOrUrl: string;
          discoverChildren: boolean;
        }>;
        childDeliveryByKey?: Record<string, 'full' | 'layered'>;
        moduleInfoKeys: string[];
      } | null;
    };
    children: Record<
      string,
      {
        config: ChildPlatformConfig;
        active: {
          sid: string;
          routes: Array<{
            route: string;
            moduleName: string;
            expose: string;
            versionOrUrl: string;
            discoverChildren: boolean;
          }>;
          moduleInfoKeys: string[];
        } | null;
      }
    >;
  };
}

interface GlobalModuleEntryView {
  key: string;
  moduleName: string;
  version?: string;
  buildVersion?: string;
  remoteEntry?: string;
  remotesInfo?: Record<string, { matchedVersion?: string }>;
  exposes?: string[];
}

interface BundledChildPreview {
  parentKey: string;
  consumer: string;
  routes: Array<{ route: string; moduleName: string; expose: string }>;
  moduleInfoKeys: string[];
}

interface ClientRuntimeTelemetry {
  hydratedFromSSR: boolean;
  registeredRemotes: Array<{ name: string; entry?: string; version?: string }>;
  globalSnapshotKeys: string[];
  globalModuleInfo: GlobalModuleEntryView[];
  bundledChildren: BundledChildPreview[];
}

interface RouteEditorTarget {
  mode: 'add-root' | 'edit-root' | 'add-child' | 'edit-child';
  parentAppId?: string;
  parentRoutePrefix?: string;
  childSourceName?: string;
  editingId?: string;
  initial: {
    route: string;
    sourceKind: 'registry' | 'url';
    producerName: string;
    version: string;
    manifestUrl: string;
    expose: string;
    render?: 'bridge' | 'component';
    stationProp: string;
  };
}

const DRAFT_STORAGE_KEY = 'mf-lab-apps-platform-draft-v1';

function saveLocalDraft(
  portal: PortalPlatformConfig,
  children: Record<string, ChildPlatformConfig>,
) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ portal, children }),
    );
  } catch {
    // ignore storage quota errors
  }
}

function readLocalDraft(): {
  portal: PortalPlatformConfig;
  children: Record<string, ChildPlatformConfig>;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.portal && parsed?.children) return parsed;
  } catch {
    // ignore corrupt draft
  }
  return null;
}

function clearLocalDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function deploymentApiBase(): string {
  return process.env.MF_LAB_API || '';
}

function defaultConsumerOrigin(): string {
  return process.env.MF_LAB_CONSUMER || 'http://localhost:4308';
}

function stripRouteWildcard(route: string): string {
  return route
    .replace(/\/?\*$/, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function normalizeRouteForCompare(route: string): string {
  return route.trim().replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
}

function isWildcardRoute(routePattern: string): boolean {
  return /\*$/.test(routePattern.trim());
}

function pathMatchesRoute(pathname: string, routePattern: string): boolean {
  const cleanPath = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  const prefix = stripRouteWildcard(routePattern);
  if (isWildcardRoute(routePattern)) {
    if (!prefix) return true;
    return cleanPath === prefix || cleanPath.startsWith(`${prefix}/`);
  }
  return cleanPath === prefix;
}

function findBestMatchingRoute<T extends { route: string }>(
  routes: readonly T[],
  pathname: string,
): T | undefined {
  const matches = routes.filter(r => pathMatchesRoute(pathname, r.route));
  if (matches.length <= 1) return matches[0];
  return [...matches].sort((a, b) => {
    const aWild = isWildcardRoute(a.route) ? 1 : 0;
    const bWild = isWildcardRoute(b.route) ? 1 : 0;
    if (aWild !== bWild) return aWild - bWild;
    return (
      stripRouteWildcard(b.route).length - stripRouteWildcard(a.route).length
    );
  })[0];
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M13 8a5 5 0 1 1-1.3-3.4M13 3v3h-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M9.5 3H13v3.5M13 3 7.5 8.5M11.5 9v3.5h-8v-8H7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5h11M6 4.5V3h4v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M3 8a5 5 0 1 0 1.5-3.5L3 6m0-3v3h3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M8 3.2v9.6M3.2 8h9.6" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M11.2 2.8 13.2 4.8 5.4 12.6 2.8 13.2l.6-2.6 7.8-7.8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

function RouteEditorModal({
  target,
  registry,
  siblingRoutes,
  presets,
  onClose,
  onConfirm,
}: {
  target: RouteEditorTarget;
  registry: RegistryProducer[];
  siblingRoutes: Array<{ id: string; route: string; enabled: boolean }>;
  presets: PlatformStateResponse['presets'];
  onClose: () => void;
  onConfirm: (result: {
    route: string;
    sourceKind: 'registry' | 'url';
    producerName: string;
    version: string;
    manifestUrl: string;
    expose: string;
    render?: 'bridge' | 'component';
    stationProp: string;
  }) => void;
}) {
  const [route, setRoute] = useState(target.initial.route);
  const [sourceKind, setSourceKind] = useState<'registry' | 'url'>(
    target.initial.sourceKind,
  );
  const [producerName, setProducerName] = useState(target.initial.producerName);
  const [version, setVersion] = useState(target.initial.version);
  const [manifestUrl, setManifestUrl] = useState(target.initial.manifestUrl);
  const [expose, setExpose] = useState(target.initial.expose);
  const [renderHint, setRenderHint] = useState<'bridge' | 'component'>(
    target.initial.render || 'bridge',
  );
  const [stationProp, setStationProp] = useState(target.initial.stationProp);

  const [inspecting, setInspecting] = useState(false);
  const [inspected, setInspected] = useState<InspectedManifest | null>(null);
  const [inspectError, setInspectError] = useState('');

  // Resolve effective manifestUrl from either registry or direct Entry URL
  const selectedProducer =
    registry.find(p => p.name === producerName) || registry[0];
  const selectedVersionObj =
    selectedProducer?.versions.find(v => v.version === version) ||
    selectedProducer?.versions[0];
  const effectiveManifestUrl =
    sourceKind === 'registry'
      ? selectedVersionObj?.manifestUrl || ''
      : manifestUrl.trim();

  // Auto-fetch manifest whenever effectiveManifestUrl changes
  useEffect(() => {
    if (!effectiveManifestUrl) {
      setInspected(null);
      setInspectError('');
      return;
    }
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setInspecting(true);
        setInspectError('');
        try {
          const res = await fetch(
            `${deploymentApiBase()}/_lab/deployments/inspect?manifestUrl=${encodeURIComponent(effectiveManifestUrl)}`,
            { cache: 'no-store' },
          );
          const data = await res.json();
          if (cancelled) return;
          if (!res.ok) {
            setInspected(null);
            setInspectError(data.error || `请求失败 (HTTP ${res.status})`);
            return;
          }
          const manifest = data as InspectedManifest;
          setInspected(manifest);
          if (
            manifest.exposes.length > 0 &&
            !manifest.exposes.some(e => e.path === expose)
          ) {
            setExpose(manifest.exposes[0].path);
          }
        } catch (err) {
          if (!cancelled) {
            setInspected(null);
            setInspectError(
              err instanceof Error ? err.message : '无法解析 Manifest',
            );
          }
        } finally {
          if (!cancelled) setInspecting(false);
        }
      },
      sourceKind === 'url' ? 280 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [effectiveManifestUrl, sourceKind]);

  // Real-time route conflict validation
  const normalizedRoute = normalizeRouteForCompare(route);
  const routeError = useMemo(() => {
    if (!route.trim()) return '请输入路由路径（如 for、for/b 或 for/*）';
    if (!normalizedRoute) return '路由路径不能为空';
    const conflict = siblingRoutes.find(
      item =>
        item.enabled &&
        item.id !== target.editingId &&
        normalizeRouteForCompare(item.route) === normalizedRoute,
    );
    if (conflict) {
      return `路由「/${route.trim().replace(/^\/+/, '')}」与已有路由「/${conflict.route.replace(/^\/+/, '')}」冲突`;
    }
    return '';
  }, [route, normalizedRoute, siblingRoutes, target.editingId]);

  const canSubmit =
    !routeError &&
    Boolean(effectiveManifestUrl) &&
    Boolean(inspected) &&
    Boolean(expose) &&
    !inspecting;

  const modalTitle =
    target.mode === 'add-root'
      ? '添加路由'
      : target.mode === 'edit-root'
        ? '编辑路由'
        : target.mode === 'add-child'
          ? `添加子路由（/${target.parentRoutePrefix}/...）`
          : `编辑子路由（/${target.parentRoutePrefix}/...）`;

  const selectedExposeMeta = inspected?.exposes.find(e => e.path === expose);
  const manifestDeclaresRender = Boolean(selectedExposeMeta?.render);

  const handleSubmit = () => {
    if (!canSubmit || !inspected) return;
    // Preserve exact routes (e.g. `for`, `for/b`) as well as wildcard routes (`for/*`).
    const finalRoute = route.trim().replace(/^\/+/, '').replace(/\/+$/, '');
    onConfirm({
      route: finalRoute,
      sourceKind,
      producerName: inspected.name,
      version:
        sourceKind === 'registry' ? selectedVersionObj?.version || 'v1' : 'url',
      manifestUrl: effectiveManifestUrl,
      expose,
      // Only send explicit render hint when the producer's manifest omits
      // `exposes[i].render` (legacy Bridge / Vmok compatibility).
      ...(!manifestDeclaresRender ? { render: renderHint } : {}),
      stationProp: stationProp.trim(),
    });
  };

  return (
    <div
      className="jo-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="jo-modal" data-testid="route-editor-modal">
        <div className="jo-modal-head">
          <h3 className="jo-modal-title">{modalTitle}</h3>
          <button
            type="button"
            className="jo-icon-btn"
            aria-label="关闭"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="jo-modal-body">
          {/* 1. Route Path + Real-time conflict check */}
          <div className="jo-form-group">
            <label className="jo-form-label" htmlFor="jo-modal-route">
              <span>路由路径</span>
              {!routeError && route.trim() && (
                <span style={{ color: '#16a34a', fontWeight: 550 }}>
                  无冲突
                </span>
              )}
            </label>
            <div className="jo-input-capsule" style={{ width: '100%' }}>
              <span
                style={{ color: '#71717a', fontSize: '12px', flex: 'none' }}
              >
                {target.parentRoutePrefix
                  ? `/${target.parentRoutePrefix}/`
                  : '/'}
              </span>
              <input
                id="jo-modal-route"
                className="mono"
                autoFocus
                placeholder="for、for/b 或 for/*"
                data-testid="modal-route-input"
                value={route}
                onChange={e => setRoute(e.target.value)}
              />
            </div>
            <div className="jo-form-hint">
              精确路径如 <code>for</code> / <code>for/b</code>，含子路径请加{' '}
              <code>/*</code>
            </div>
            {routeError && (
              <div className="jo-form-error" data-testid="modal-route-error">
                {routeError}
              </div>
            )}
          </div>

          {/* 2. Source kind switch: Registry (local version platform) vs Entry URL */}
          <div className="jo-form-group">
            <span className="jo-form-label">生产者来源</span>
            <div className="jo-segmented" style={{ alignSelf: 'flex-start' }}>
              <button
                type="button"
                data-testid="modal-source-registry"
                className={`jo-seg-btn ${sourceKind === 'registry' ? 'active' : ''}`}
                onClick={() => setSourceKind('registry')}
              >
                本地版本平台
              </button>
              <button
                type="button"
                data-testid="modal-source-url"
                className={`jo-seg-btn ${sourceKind === 'url' ? 'active' : ''}`}
                onClick={() => setSourceKind('url')}
              >
                Entry URL
              </button>
            </div>
          </div>

          {sourceKind === 'registry' ? (
            <div className="jo-form-group">
              <span className="jo-form-label">生产者与版本</span>
              <div className="jo-form-row-2">
                <div className="jo-input-capsule">
                  <select
                    aria-label="选择生产者"
                    data-testid="modal-producer-select"
                    value={selectedProducer?.name || ''}
                    onChange={e => {
                      const nextName = e.target.value;
                      setProducerName(nextName);
                      const nextProd = registry.find(p => p.name === nextName);
                      if (nextProd?.versions[0]) {
                        setVersion(nextProd.versions[0].version);
                      }
                    }}
                  >
                    {registry.map(p => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="jo-input-capsule">
                  <select
                    aria-label="选择版本"
                    data-testid="modal-version-select"
                    value={selectedVersionObj?.version || ''}
                    onChange={e => setVersion(e.target.value)}
                  >
                    {(selectedProducer?.versions || []).map(v => (
                      <option key={v.version} value={v.version}>
                        {v.version}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="jo-form-group">
              <label className="jo-form-label" htmlFor="jo-modal-entry-url">
                <span>Manifest Entry URL</span>
                {inspecting && (
                  <span style={{ color: '#71717a' }}>解析中…</span>
                )}
                {!inspecting && inspected && (
                  <span style={{ color: '#16a34a' }}>
                    已解析 {inspected.name}（{inspected.exposes.length} 个导出）
                  </span>
                )}
              </label>
              <div className="jo-input-capsule" style={{ width: '100%' }}>
                <input
                  id="jo-modal-entry-url"
                  className="mono"
                  placeholder="http://localhost:4301/static/mf-manifest.json"
                  data-testid="modal-entry-url-input"
                  value={manifestUrl}
                  onChange={e => setManifestUrl(e.target.value)}
                />
              </div>
              <div className="jo-form-hint">
                <span>快捷填入：</span>
                <button
                  type="button"
                  className="jo-chip-btn"
                  onClick={() => setManifestUrl(presets.providerV1)}
                >
                  provider v1
                </button>
                {presets.providerV2 && (
                  <button
                    type="button"
                    className="jo-chip-btn"
                    onClick={() => setManifestUrl(presets.providerV2!)}
                  >
                    provider v2
                  </button>
                )}
                {presets.nested && (
                  <button
                    type="button"
                    className="jo-chip-btn"
                    onClick={() => setManifestUrl(presets.nested!)}
                  >
                    nested
                  </button>
                )}
              </div>
              {inspectError && (
                <div
                  className="jo-form-error"
                  data-testid="modal-inspect-error"
                >
                  {inspectError}
                </div>
              )}
            </div>
          )}

          {/* 3. Auto-populated Expose selector */}
          <div className="jo-form-group">
            <label className="jo-form-label" htmlFor="jo-modal-expose">
              <span>导出模块（Expose）</span>
              {inspected && (
                <span style={{ color: '#71717a', fontWeight: 500 }}>
                  {inspected.name}
                </span>
              )}
            </label>
            <div className="jo-input-capsule" style={{ width: '100%' }}>
              <select
                id="jo-modal-expose"
                data-testid="modal-expose-select"
                disabled={!inspected || inspecting}
                value={expose}
                onChange={e => setExpose(e.target.value)}
              >
                {!inspected ? (
                  <option value="">
                    {inspecting
                      ? '正在拉取 manifest…'
                      : '请先填写有效生产者或 Entry URL'}
                  </option>
                ) : (
                  inspected.exposes.map(item => (
                    <option key={item.path} value={item.path}>
                      {item.path}
                      {item.render ? ` (${item.render})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 4. Legacy render protocol hint (shown ONLY when manifest omits exposes[i].render) */}
          {inspected && expose && !manifestDeclaresRender && (
            <div
              className="jo-form-group"
              data-testid="modal-render-hint-group"
            >
              <span className="jo-form-label">
                <span>渲染协议（老版本兼容）</span>
                <span style={{ color: '#71717a', fontWeight: 500 }}>
                  Manifest 未声明 render 字段
                </span>
              </span>
              <div className="jo-segmented" style={{ alignSelf: 'flex-start' }}>
                <button
                  type="button"
                  data-testid="modal-render-bridge"
                  className={`jo-seg-btn ${renderHint === 'bridge' ? 'active' : ''}`}
                  onClick={() => setRenderHint('bridge')}
                >
                  Bridge 应用
                </button>
                <button
                  type="button"
                  data-testid="modal-render-component"
                  className={`jo-seg-btn ${renderHint === 'component' ? 'active' : ''}`}
                  onClick={() => setRenderHint('component')}
                >
                  普通组件
                </button>
              </div>
            </div>
          )}

          {/* Optional prop for WindApplication */}
          {expose === './WindApplication' && (
            <div className="jo-form-group">
              <label className="jo-form-label" htmlFor="jo-modal-station">
                下发参数（station prop）
              </label>
              <div className="jo-input-capsule" style={{ width: '100%' }}>
                <input
                  id="jo-modal-station"
                  placeholder="West Lake Ridge"
                  value={stationProp}
                  onChange={e => setStationProp(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="jo-modal-foot">
          <button type="button" className="jo-icon-btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="jo-btn-primary"
            disabled={!canSubmit}
            data-testid="modal-confirm-btn"
            onClick={handleSubmit}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}

export function ApplicationsWorkbench() {
  const [params] = useSearchParams();
  const activeTab = params.get('tab') === 'platform' ? 'platform' : 'preview';

  const [platformState, setPlatformState] = useState<PlatformStateResponse>();
  const [portalDraft, setPortalDraft] = useState<PortalPlatformConfig>();
  const [childrenDraft, setChildrenDraft] = useState<
    Record<string, ChildPlatformConfig>
  >({});
  const [editorTarget, setEditorTarget] = useState<RouteEditorTarget | null>(
    null,
  );
  const [addressPath, setAddressPath] = useState('/air');
  const [currentConsumerPath, setCurrentConsumerPath] = useState('/air');
  const [iframeSrc, setIframeSrc] = useState(
    () => `${defaultConsumerOrigin()}/air`,
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [telemetry, setTelemetry] = useState<ClientRuntimeTelemetry>();
  const [expandedModKey, setExpandedModKey] = useState<string | null>(null);
  const [diffAddedKeys, setDiffAddedKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const seenKeysRef = useRef<Set<string>>(new Set());
  const baselineReadyRef = useRef(false);

  const consumerOrigin =
    platformState?.presets.consumerOrigin || defaultConsumerOrigin();

  const fetchState = useCallback(async (syncDrafts = false) => {
    try {
      const response = await fetch(
        `${deploymentApiBase()}/_lab/deployments/state`,
        { cache: 'no-store' },
      );
      if (!response.ok) {
        throw new Error(`Platform state HTTP ${response.status}`);
      }
      const data = (await response.json()) as PlatformStateResponse;
      setPlatformState(data);
      if (syncDrafts) {
        const localDraft = readLocalDraft();
        if (localDraft) {
          setPortalDraft(localDraft.portal);
          setChildrenDraft(localDraft.children);
        } else {
          setPortalDraft(structuredClone(data.sources.portal.config));
          const nextChildren: Record<string, ChildPlatformConfig> = {};
          for (const [k, v] of Object.entries(data.sources.children || {})) {
            nextChildren[k] = structuredClone(v.config);
          }
          setChildrenDraft(nextChildren);
        }
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void fetchState(true);
    const timer = setInterval(() => {
      void fetchState(false);
    }, 1500);
    return () => clearInterval(timer);
  }, [fetchState]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'mf-lab-apps-trace') {
        const nextTelemetry = data.telemetry as ClientRuntimeTelemetry;
        const incomingKeys = (nextTelemetry.globalModuleInfo || []).map(
          item => item.key,
        );
        if (!baselineReadyRef.current) {
          seenKeysRef.current = new Set(incomingKeys);
          baselineReadyRef.current = true;
          setDiffAddedKeys(new Set());
        } else {
          const newlyAdded = incomingKeys.filter(
            key => !seenKeysRef.current.has(key),
          );
          if (newlyAdded.length > 0) {
            for (const key of newlyAdded) seenKeysRef.current.add(key);
            setDiffAddedKeys(new Set(newlyAdded));
          }
        }
        setTelemetry(nextTelemetry);
        if (typeof data.pathname === 'string') {
          setCurrentConsumerPath(data.pathname);
          setAddressPath(data.pathname);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const buildConsumerUrl = (pathname: string) => {
    const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return new URL(clean, consumerOrigin).toString();
  };

  const hardLoadConsumer = (pathname: string) => {
    const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
    baselineReadyRef.current = false;
    seenKeysRef.current = new Set();
    setDiffAddedKeys(new Set());
    setAddressPath(clean);
    setCurrentConsumerPath(clean);
    setIframeSrc(buildConsumerUrl(clean));
    setIframeKey(prev => prev + 1);
  };

  const csrNavigateConsumer = (pathname: string) => {
    const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
    setAddressPath(clean);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'mf-lab-apps-navigate', to: clean },
        '*',
      );
    } else {
      hardLoadConsumer(clean);
    }
  };

  const syncDraftsFromState = (data: PlatformStateResponse) => {
    clearLocalDraft();
    setPlatformState(data);
    setPortalDraft(structuredClone(data.sources.portal.config));
    const nextChildren: Record<string, ChildPlatformConfig> = {};
    for (const [k, v] of Object.entries(data.sources.children || {})) {
      nextChildren[k] = structuredClone(v.config);
    }
    setChildrenDraft(nextChildren);
  };

  const publishConfigs = async (
    nextPortal: PortalPlatformConfig,
    nextChildren: Record<string, ChildPlatformConfig>,
  ) => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch(
        `${deploymentApiBase()}/_lab/deployments/publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portal: nextPortal,
            children: nextChildren,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Publish failed (${response.status})`);
      }
      syncDraftsFromState(data as PlatformStateResponse);
      const modeLabel =
        data.computedDelivery?.mode === 'full' ? '全量下发' : '分层下发';
      setNotice(`已保存并发布 · 当前下发模式：${modeLabel}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const publishAll = async () => {
    if (!portalDraft) return;
    await publishConfigs(portalDraft, childrenDraft);
  };

  const resetPlatform = async () => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch(
        `${deploymentApiBase()}/_lab/deployments/reset`,
        { method: 'POST' },
      );
      const data = (await response.json()) as PlatformStateResponse;
      syncDraftsFromState(data);
      setNotice('已恢复默认配置');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const updatePortalApp = (id: string, patch: Partial<PlatformAppConfig>) => {
    if (!portalDraft) return;
    const nextPortal: PortalPlatformConfig = {
      ...portalDraft,
      applications: portalDraft.applications.map(app =>
        app.id === id ? { ...app, ...patch } : app,
      ),
    };
    setPortalDraft(nextPortal);
    saveLocalDraft(nextPortal, childrenDraft);
  };

  const removeOrTogglePortalApp = (app: PlatformAppConfig) => {
    if (!portalDraft) return;
    const nextPortal: PortalPlatformConfig = app.id.startsWith('custom-')
      ? {
          ...portalDraft,
          applications: portalDraft.applications.filter(a => a.id !== app.id),
        }
      : {
          ...portalDraft,
          applications: portalDraft.applications.map(a =>
            a.id === app.id ? { ...a, enabled: !a.enabled } : a,
          ),
        };
    setPortalDraft(nextPortal);
    saveLocalDraft(nextPortal, childrenDraft);
  };

  const removeOrToggleChildApp = (
    sourceName: string,
    child: PlatformAppConfig,
  ) => {
    const cfg = childrenDraft[sourceName];
    if (!cfg || !portalDraft) return;
    const nextApps = child.id.startsWith('custom-')
      ? cfg.applications.filter(c => c.id !== child.id)
      : cfg.applications.map(c =>
          c.id === child.id ? { ...c, enabled: !c.enabled } : c,
        );
    const nextChildren: Record<string, ChildPlatformConfig> = {
      ...childrenDraft,
      [sourceName]: { ...cfg, applications: nextApps },
    };
    setChildrenDraft(nextChildren);
    saveLocalDraft(portalDraft, nextChildren);
  };

  const handleModalConfirm = (result: {
    route: string;
    sourceKind: 'registry' | 'url';
    producerName: string;
    version: string;
    manifestUrl: string;
    expose: string;
    render?: 'bridge' | 'component';
    stationProp: string;
  }) => {
    if (!editorTarget || !portalDraft) return;
    const props: Record<string, string> = result.stationProp
      ? { station: result.stationProp }
      : {};

    let nextPortal: PortalPlatformConfig = portalDraft;
    let nextChildren: Record<string, ChildPlatformConfig> = childrenDraft;

    if (editorTarget.mode === 'add-root') {
      const id = `custom-${Date.now()}`;
      nextPortal = {
        ...portalDraft,
        applications: [
          ...portalDraft.applications,
          {
            id,
            title: result.expose,
            enabled: true,
            route: result.route,
            sourceKind: result.sourceKind,
            producerName: result.producerName,
            version: result.version,
            manifestUrl: result.manifestUrl,
            expose: result.expose,
            ...(result.render ? { render: result.render } : {}),
            childrenMode: 'none',
            childrenDelivery: 'full',
            props,
          },
        ],
      };
    } else if (editorTarget.mode === 'edit-root' && editorTarget.editingId) {
      nextPortal = {
        ...portalDraft,
        applications: portalDraft.applications.map(app =>
          app.id === editorTarget.editingId
            ? {
                ...app,
                route: result.route,
                sourceKind: result.sourceKind,
                producerName: result.producerName,
                version: result.version,
                manifestUrl: result.manifestUrl,
                expose: result.expose,
                render: result.render,
              }
            : app,
        ),
      };
    } else if (editorTarget.mode === 'add-child' && editorTarget.parentAppId) {
      const parentApp = portalDraft.applications.find(
        a => a.id === editorTarget.parentAppId,
      );
      if (parentApp) {
        const sourceName =
          parentApp.childrenSource || `${parentApp.id}-children`;
        nextPortal = {
          ...portalDraft,
          applications: portalDraft.applications.map(app =>
            app.id === parentApp.id
              ? {
                  ...app,
                  childrenMode: 'dynamic',
                  childrenSource: sourceName,
                  childrenDelivery: app.childrenDelivery || 'full',
                }
              : app,
          ),
        };
        const existing = childrenDraft[sourceName] || {
          consumer: parentApp.producerName || 'lab_provider',
          consumerManifestUrl: parentApp.manifestUrl,
          applications: [],
        };
        nextChildren = {
          ...childrenDraft,
          [sourceName]: {
            ...existing,
            applications: [
              ...existing.applications,
              {
                id: `custom-child-${Date.now()}`,
                title: result.expose,
                enabled: true,
                route: result.route,
                sourceKind: result.sourceKind,
                producerName: result.producerName,
                version: result.version,
                manifestUrl: result.manifestUrl,
                expose: result.expose,
                ...(result.render ? { render: result.render } : {}),
                childrenMode: 'none',
                props,
              },
            ],
          },
        };
      }
    } else if (
      editorTarget.mode === 'edit-child' &&
      editorTarget.childSourceName &&
      editorTarget.editingId
    ) {
      const sourceName = editorTarget.childSourceName;
      const cfg = childrenDraft[sourceName];
      if (cfg) {
        nextChildren = {
          ...childrenDraft,
          [sourceName]: {
            ...cfg,
            applications: cfg.applications.map(c =>
              c.id === editorTarget.editingId
                ? {
                    ...c,
                    route: result.route,
                    sourceKind: result.sourceKind,
                    producerName: result.producerName,
                    version: result.version,
                    manifestUrl: result.manifestUrl,
                    expose: result.expose,
                    render: result.render,
                    props: result.stationProp
                      ? { ...c.props, station: result.stationProp }
                      : c.props,
                  }
                : c,
            ),
          },
        };
      }
    }

    setPortalDraft(nextPortal);
    setChildrenDraft(nextChildren);
    saveLocalDraft(nextPortal, nextChildren);
    setEditorTarget(null);
    // Persist & publish immediately on modal confirm so switching tabs never loses edits.
    void publishConfigs(nextPortal, nextChildren);
  };

  const portalActive = platformState?.sources.portal.active;
  const childrenState = platformState?.sources.children || {};
  const activeMode = platformState?.computedDelivery?.mode || 'full';
  const registry = platformState?.registry || [];

  // Computed draft delivery mode: ONLY routes with enabled nested children participate in layering!
  const draftHasLayered = Boolean(
    portalDraft?.applications.some(app => {
      if (!app.enabled || !app.childrenSource) return false;
      const kids = childrenDraft[app.childrenSource]?.applications || [];
      const hasEnabledKids = kids.some(k => k.enabled);
      return hasEnabledKids && app.childrenDelivery === 'layered';
    }),
  );

  // Dynamically build quick-nav pills from published root & nested routes
  const quickRoutes = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      path: string;
      active: boolean;
    }> = [];
    const matchedBestRoot = findBestMatchingRoute(
      portalActive?.routes || [],
      currentConsumerPath,
    );
    for (const r of portalActive?.routes || []) {
      const prefix = stripRouteWildcard(r.route);
      if (!prefix) continue;
      const matchedApp = platformState?.sources.portal.config.applications.find(
        a =>
          normalizeRouteForCompare(a.route) ===
            normalizeRouteForCompare(r.route) && a.enabled,
      );
      const childRoutes = matchedApp?.childrenSource
        ? childrenState[matchedApp.childrenSource]?.active?.routes || []
        : [];
      const targetPath =
        r.expose === './WeatherApplication' && isWildcardRoute(r.route)
          ? `/${prefix}/overview`
          : `/${prefix}`;
      const matchedChildPrefix = childRoutes.find(c =>
        pathMatchesRoute(
          currentConsumerPath
            .replace(/^\/+/, '')
            .slice(prefix.length)
            .replace(/^\/+/, ''),
          c.route,
        ),
      );
      items.push({
        id: `root-${r.route}`,
        label: `/${prefix}`,
        path: targetPath,
        active: matchedBestRoot?.route === r.route && !matchedChildPrefix,
      });
      if (r.discoverChildren) {
        for (const c of childRoutes) {
          const cPrefix = stripRouteWildcard(c.route);
          if (!cPrefix) continue;
          const nestedPath =
            c.expose === './WindApplication' && isWildcardRoute(c.route)
              ? `/${prefix}/${cPrefix}/gusts`
              : `/${prefix}/${cPrefix}`;
          items.push({
            id: `nested-${r.route}-${c.route}`,
            label: `嵌套 /${prefix}/${cPrefix}`,
            path: nestedPath,
            active:
              matchedBestRoot?.route === r.route &&
              Boolean(
                matchedChildPrefix && matchedChildPrefix.route === c.route,
              ),
          });
        }
      }
    }
    return items;
  }, [portalActive, childrenState, platformState, currentConsumerPath]);

  // Active rendered module chain for current URL
  const activeRenderChain = useMemo(() => {
    const chain: Array<{
      level: number;
      route: string;
      moduleName: string;
      expose: string;
      versionOrUrl: string;
      snapshotKey: string;
    }> = [];
    const matchedRoot = findBestMatchingRoute(
      portalActive?.routes || [],
      currentConsumerPath,
    );
    if (!matchedRoot) return chain;
    const rootPrefix = stripRouteWildcard(matchedRoot.route);
    chain.push({
      level: 0,
      route: `/${matchedRoot.route.replace(/^\/+/, '')}`,
      moduleName: matchedRoot.moduleName,
      expose: matchedRoot.expose,
      versionOrUrl: matchedRoot.versionOrUrl,
      snapshotKey: `${matchedRoot.moduleName}:${matchedRoot.versionOrUrl}`,
    });
    if (matchedRoot.discoverChildren) {
      const rest = currentConsumerPath
        .replace(/^\/+/, '')
        .slice(rootPrefix.length)
        .replace(/^\/+/, '');
      const matchedApp = platformState?.sources.portal.config.applications.find(
        a =>
          normalizeRouteForCompare(a.route) ===
            normalizeRouteForCompare(matchedRoot.route) && a.enabled,
      );
      const childRoutes = matchedApp?.childrenSource
        ? childrenState[matchedApp.childrenSource]?.active?.routes || []
        : [];
      const matchedChild = findBestMatchingRoute(childRoutes, rest);
      if (matchedChild) {
        chain.push({
          level: 1,
          route: `/${rootPrefix}/${matchedChild.route.replace(/^\/+/, '')}`,
          moduleName: matchedChild.moduleName,
          expose: matchedChild.expose,
          versionOrUrl: matchedChild.versionOrUrl,
          snapshotKey: `${matchedChild.moduleName}:${matchedChild.versionOrUrl}`,
        });
      }
    }
    return chain;
  }, [portalActive, childrenState, platformState, currentConsumerPath]);

  const activeModuleNames = useMemo(
    () => new Set(activeRenderChain.map(item => item.moduleName)),
    [activeRenderChain],
  );
  const activeSnapshotKeys = useMemo(
    () => new Set(activeRenderChain.map(item => item.snapshotKey)),
    [activeRenderChain],
  );

  // Sibling routes for conflict check inside modal
  const modalSiblingRoutes = useMemo(() => {
    if (!editorTarget) return [];
    if (editorTarget.mode === 'add-root' || editorTarget.mode === 'edit-root') {
      return (portalDraft?.applications || []).map(a => ({
        id: a.id,
        route: a.route,
        enabled: a.enabled,
      }));
    }
    const sourceName = editorTarget.childSourceName;
    const apps = sourceName
      ? childrenDraft[sourceName]?.applications || []
      : [];
    return apps.map(c => ({ id: c.id, route: c.route, enabled: c.enabled }));
  }, [editorTarget, portalDraft, childrenDraft]);

  return (
    <LabLayout
      section="apps"
      title="应用发现"
      tabs={[
        {
          label: '应用渲染',
          href: '/?lab=apps&tab=preview',
          active: activeTab === 'preview',
        },
        {
          label: '部署配置',
          href: '/?lab=apps&tab=platform',
          active: activeTab === 'platform',
        },
      ]}
    >
      <div className="jo-apps">
        {notice && (
          <div className="jo-toast" data-testid="apps-notice">
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="jo-toast error" role="alert" data-testid="apps-error">
            {error}
          </div>
        )}

        {activeTab === 'preview' ? (
          <div className="jo-surface">
            <div className="jo-render-grid">
              {/* Primary Visual Focus: Live Consumer Viewport */}
              <div className="jo-preview-pane">
                <div className="jo-glass-bar">
                  <div
                    className="jo-segmented"
                    role="tablist"
                    aria-label="Dynamic routes"
                  >
                    {quickRoutes.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`nav-${item.id}`}
                        className={`jo-seg-btn ${item.active ? 'active' : ''}`}
                        onClick={() => csrNavigateConsumer(item.path)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flex: '1 1 180px',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      className="jo-input-capsule"
                      style={{ flex: '1 1 150px', maxWidth: '240px' }}
                    >
                      <input
                        className="mono"
                        aria-label="Consumer URL path"
                        data-testid="consumer-url-input"
                        value={addressPath}
                        onChange={e => setAddressPath(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') hardLoadConsumer(addressPath);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="jo-icon-btn"
                      data-testid="consumer-ssr-go"
                      aria-label="SSR 刷新当前路径"
                      title="SSR 刷新当前路径"
                      onClick={() => hardLoadConsumer(addressPath)}
                    >
                      <RefreshIcon />
                    </button>
                    <a
                      className="jo-icon-btn"
                      href={buildConsumerUrl(currentConsumerPath)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="在新窗口打开消费者"
                      title="在新窗口打开消费者"
                    >
                      <ExternalIcon />
                    </a>
                  </div>
                </div>

                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  title="Dynamic consumer preview"
                  data-testid="dynamic-consumer-iframe"
                  className="jo-iframe"
                  src={iframeSrc}
                />
              </div>

              {/* Right Module Info Inspector */}
              <aside
                className="jo-trace-rail"
                aria-label="Module info inspector"
              >
                <div className="jo-rail-head">
                  <span className="jo-pill" data-testid="active-delivery-mode">
                    <span
                      className={`jo-dot ${activeMode === 'full' ? 'ok' : 'info'}`}
                    />
                    {activeMode === 'full' ? '全量下发' : '分层下发'}
                  </span>
                  {diffAddedKeys.size > 0 && (
                    <span className="jo-badge diff" data-testid="diff-badge">
                      +{diffAddedKeys.size} 分层新增
                    </span>
                  )}
                </div>

                <div className="jo-section-label">
                  <span>当前渲染模块</span>
                  <span>{activeRenderChain.length} 层</span>
                </div>
                <div
                  className="jo-active-box"
                  data-testid="active-render-chain"
                >
                  {activeRenderChain.length === 0 ? (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--jo-text-muted)',
                      }}
                    >
                      当前路径未命中动态模块（本地路由 / 404）
                    </div>
                  ) : (
                    activeRenderChain.map(node => (
                      <div
                        key={`${node.level}-${node.route}`}
                        className={
                          node.level > 0
                            ? 'jo-active-node nested'
                            : 'jo-active-node'
                        }
                        style={{
                          flexDirection: 'column',
                          alignItems: 'stretch',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {node.level > 0 && (
                              <span
                                style={{
                                  color: 'var(--jo-text-muted)',
                                  fontFamily: 'monospace',
                                }}
                              >
                                └
                              </span>
                            )}
                            <span className="jo-dot info" />
                            <span>{node.moduleName}</span>
                          </span>
                          <span className="jo-badge rendering">
                            {node.level > 0 ? '嵌套渲染中' : '渲染中'}
                          </span>
                        </div>
                        <div className="jo-active-sub">
                          {node.expose} · {node.route}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="jo-section-label">
                  <span>globalModuleInfo</span>
                  <span>{telemetry?.globalModuleInfo.length ?? 0} 项</span>
                </div>

                <div
                  className="jo-trace-list"
                  data-testid="global-module-info-list"
                >
                  {(telemetry?.globalModuleInfo || []).length === 0 ? (
                    <div
                      style={{
                        padding: '16px 14px',
                        fontSize: '12px',
                        color: 'var(--jo-text-muted)',
                      }}
                    >
                      等待消费者上报 globalModuleInfo…
                    </div>
                  ) : (
                    (telemetry?.globalModuleInfo || []).map(mod => {
                      const isRendering =
                        activeSnapshotKeys.has(mod.key) ||
                        activeModuleNames.has(mod.moduleName);
                      const isDiffAdded = diffAddedKeys.has(mod.key);
                      const isExpanded = expandedModKey === mod.key;
                      const remoteEntries = Object.entries(
                        mod.remotesInfo || {},
                      );
                      const bundledForMod = (
                        telemetry?.bundledChildren || []
                      ).filter(
                        b =>
                          b.consumer === mod.moduleName ||
                          b.parentKey.startsWith(`${mod.moduleName}::`),
                      );
                      const rowClass = [
                        'jo-mod-row',
                        isDiffAdded
                          ? 'diff-added'
                          : isRendering
                            ? 'rendering'
                            : '',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <div
                          key={mod.key}
                          data-testid={`global-mod-${mod.moduleName}`}
                          data-diff-added={isDiffAdded ? 'true' : undefined}
                          className={rowClass}
                          onClick={() =>
                            setExpandedModKey(isExpanded ? null : mod.key)
                          }
                        >
                          <div className="jo-mod-top">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                minWidth: 0,
                              }}
                            >
                              <span
                                className={`jo-dot ${isDiffAdded ? 'ok' : isRendering ? 'info' : ''}`}
                              />
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {mod.moduleName}
                              </span>
                            </span>
                            <div
                              style={{
                                display: 'inline-flex',
                                gap: '4px',
                                flex: 'none',
                              }}
                            >
                              {isDiffAdded && (
                                <span className="jo-badge diff">+ 新增</span>
                              )}
                              {isRendering && (
                                <span className="jo-badge rendering">
                                  渲染中
                                </span>
                              )}
                              {!isRendering && !isDiffAdded && (
                                <span className="jo-badge muted">已下发</span>
                              )}
                            </div>
                          </div>

                          {mod.remoteEntry && (
                            <div className="jo-mod-sub">
                              entry: {mod.remoteEntry}
                            </div>
                          )}

                          {remoteEntries.length > 0 && (
                            <div className="jo-mod-nested-list">
                              {remoteEntries.map(([depName, depInfo]) => (
                                <div
                                  key={depName}
                                  className="jo-mod-nested-item"
                                >
                                  <span>└ {depName}</span>
                                  <span
                                    style={{ color: 'var(--jo-text-muted)' }}
                                  >
                                    {depInfo.matchedVersion
                                      ? depInfo.matchedVersion.replace(
                                          /^https?:\/\/localhost:\d+/,
                                          '',
                                        )
                                      : '*'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {bundledForMod.length > 0 && (
                            <div className="jo-mod-nested-list">
                              {bundledForMod.flatMap(b =>
                                b.routes.map(r => (
                                  <div
                                    key={`${b.parentKey}-${r.route}`}
                                    className="jo-mod-nested-item"
                                  >
                                    <span>
                                      └ {r.moduleName} ({r.route})
                                    </span>
                                    <span className="jo-badge muted">
                                      全量预下发
                                    </span>
                                  </div>
                                )),
                              )}
                            </div>
                          )}

                          {isExpanded && (
                            <pre className="jo-trace-expand">
                              {JSON.stringify(mod, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="jo-rail-foot">
                  {activeMode === 'full'
                    ? '当前为全量下发：嵌套子层已随首屏预下发。'
                    : '当前为分层下发：切到嵌套路由时，新增模块将以绿色「+ 新增」高亮。'}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          /* Tab 2: Independent Route-Centric Deployment Platform */
          <div className="jo-surface">
            <div className="jo-glass-bar">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span className="jo-pill" data-testid="active-delivery-mode">
                  <span
                    className={`jo-dot ${draftHasLayered ? 'info' : 'ok'}`}
                  />
                  按路由计算：{draftHasLayered ? '分层下发' : '全量下发'}
                </span>
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <button
                  type="button"
                  className="jo-icon-btn"
                  disabled={busy || registry.length === 0}
                  data-testid="add-portal-route"
                  onClick={() =>
                    setEditorTarget({
                      mode: 'add-root',
                      initial: {
                        route: '',
                        sourceKind: 'registry',
                        producerName: registry[0]?.name || 'lab_provider',
                        version: registry[0]?.versions[0]?.version || 'v1',
                        manifestUrl: '',
                        expose: '',
                        stationProp: '',
                      },
                    })
                  }
                >
                  <PlusIcon />
                  添加路由
                </button>
                <button
                  type="button"
                  className="jo-icon-btn"
                  disabled={busy}
                  data-testid="reset-platform"
                  aria-label="恢复默认配置"
                  title="恢复默认配置"
                  onClick={() => void resetPlatform()}
                >
                  <RestoreIcon />
                  重置
                </button>
                <button
                  type="button"
                  className="jo-btn-primary"
                  disabled={busy || !portalDraft}
                  data-testid="publish-portal"
                  onClick={() => void publishAll()}
                >
                  发布配置
                </button>
              </div>
            </div>

            <div className="jo-route-table-head">
              <span>路由路径</span>
              <span>生产者与导出</span>
              <span>子层下发</span>
              <span style={{ textAlign: 'right' }}>操作</span>
            </div>

            <div>
              {portalDraft?.applications.map(app => {
                const childSourceName = app.childrenSource;
                const childList = childSourceName
                  ? childrenDraft[childSourceName]?.applications || []
                  : [];
                const hasEnabledChildren =
                  app.enabled && childList.some(c => c.enabled);
                const childDelivery = app.childrenDelivery || 'full';

                return (
                  <div key={app.id}>
                    <div
                      data-testid={`portal-app-${app.id}`}
                      className={`jo-route-row ${app.enabled ? '' : 'removed'}`}
                    >
                      <div className="jo-route-path-cell">
                        <span
                          className={`jo-dot ${
                            !app.enabled
                              ? 'danger'
                              : hasEnabledChildren &&
                                  childDelivery === 'layered'
                                ? 'info'
                                : 'ok'
                          }`}
                        />
                        <code
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--jo-text-primary)',
                          }}
                        >
                          /{app.route}
                        </code>
                      </div>

                      <div className="jo-producer-cell">
                        <span className="jo-pill">
                          {app.producerName || 'lab_provider'}
                          {app.version && app.version !== 'url'
                            ? ` · ${app.version}`
                            : ''}
                        </span>
                        <span className="jo-pill">{app.expose}</span>
                        {app.sourceKind === 'url' && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--jo-text-muted)',
                              fontFamily: 'monospace',
                            }}
                          >
                            URL
                          </span>
                        )}
                      </div>

                      {/* ONLY show [全量 | 分层] when this route has nested children! */}
                      <div>
                        {hasEnabledChildren ? (
                          <div
                            className="jo-segmented"
                            role="group"
                            aria-label={`${app.id} children delivery`}
                          >
                            <button
                              type="button"
                              data-testid={`delivery-full-${app.id}`}
                              className={`jo-seg-btn ${childDelivery === 'full' ? 'active' : ''}`}
                              onClick={() =>
                                updatePortalApp(app.id, {
                                  childrenDelivery: 'full',
                                })
                              }
                            >
                              全量
                            </button>
                            <button
                              type="button"
                              data-testid={`delivery-layered-${app.id}`}
                              className={`jo-seg-btn ${childDelivery === 'layered' ? 'active' : ''}`}
                              onClick={() =>
                                updatePortalApp(app.id, {
                                  childrenDelivery: 'layered',
                                })
                              }
                            >
                              分层
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--jo-text-muted)',
                            }}
                          >
                            —
                          </span>
                        )}
                      </div>

                      <div className="jo-actions-cell">
                        {app.enabled && (
                          <button
                            type="button"
                            className="jo-icon-btn"
                            data-testid={`add-child-${app.id}`}
                            aria-label="添加嵌套子路由"
                            title="添加嵌套子路由"
                            onClick={() =>
                              setEditorTarget({
                                mode: 'add-child',
                                parentAppId: app.id,
                                parentRoutePrefix: stripRouteWildcard(
                                  app.route,
                                ),
                                childSourceName:
                                  app.childrenSource || `${app.id}-children`,
                                initial: {
                                  route: '',
                                  sourceKind: 'registry',
                                  producerName:
                                    registry.find(p => p.name === 'lab_nested')
                                      ?.name ||
                                    registry[0]?.name ||
                                    'lab_nested',
                                  version: 'v1',
                                  manifestUrl: '',
                                  expose: '',
                                  stationProp: '',
                                },
                              })
                            }
                          >
                            <PlusIcon />
                          </button>
                        )}
                        <button
                          type="button"
                          className="jo-icon-btn"
                          data-testid={`edit-portal-app-${app.id}`}
                          aria-label="编辑路由"
                          title="编辑路由"
                          onClick={() =>
                            setEditorTarget({
                              mode: 'edit-root',
                              editingId: app.id,
                              initial: {
                                route: app.route,
                                sourceKind: app.sourceKind || 'registry',
                                producerName:
                                  app.producerName || 'lab_provider',
                                version: app.version || 'v1',
                                manifestUrl: app.manifestUrl,
                                expose: app.expose,
                                render: app.render,
                                stationProp: app.props?.station || '',
                              },
                            })
                          }
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          className={`jo-icon-btn ${app.enabled ? 'danger' : ''}`}
                          data-testid={`toggle-portal-app-${app.id}`}
                          aria-label={
                            app.enabled
                              ? '删除该路由（命中 404）'
                              : '恢复该路由'
                          }
                          title={
                            app.enabled
                              ? '删除该路由（访问将命中 404）'
                              : '恢复该路由'
                          }
                          onClick={() => removeOrTogglePortalApp(app)}
                        >
                          {app.enabled ? <TrashIcon /> : <RestoreIcon />}
                        </button>
                      </div>
                    </div>

                    {/* Indented nested child routes */}
                    {app.enabled &&
                      childSourceName &&
                      childList.map(child => (
                        <div
                          key={child.id}
                          data-testid={`child-app-${child.id}`}
                          className={`jo-route-row nested ${child.enabled ? '' : 'removed'}`}
                        >
                          <div className="jo-route-path-cell">
                            <span className="jo-tree-elbow">└</span>
                            <span
                              className={`jo-dot ${
                                !child.enabled
                                  ? 'danger'
                                  : childDelivery === 'layered'
                                    ? 'info'
                                    : 'ok'
                              }`}
                            />
                            <code style={{ fontSize: '12px' }}>
                              <span style={{ color: 'var(--jo-text-muted)' }}>
                                /{stripRouteWildcard(app.route)}/
                              </span>
                              {child.route}
                            </code>
                          </div>

                          <div className="jo-producer-cell">
                            <span className="jo-pill">
                              {child.producerName || 'lab_nested'}
                              {child.version && child.version !== 'url'
                                ? ` · ${child.version}`
                                : ''}
                            </span>
                            <span className="jo-pill">{child.expose}</span>
                            {child.props?.station && (
                              <span className="jo-pill">
                                {child.props.station}
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="jo-badge muted">
                              {childDelivery === 'layered'
                                ? '按层懒加载'
                                : '随父全量'}
                            </span>
                          </div>

                          <div className="jo-actions-cell">
                            <button
                              type="button"
                              className="jo-icon-btn"
                              data-testid={`edit-child-app-${child.id}`}
                              aria-label="编辑子路由"
                              title="编辑子路由"
                              onClick={() =>
                                setEditorTarget({
                                  mode: 'edit-child',
                                  parentAppId: app.id,
                                  parentRoutePrefix: stripRouteWildcard(
                                    app.route,
                                  ),
                                  childSourceName,
                                  editingId: child.id,
                                  initial: {
                                    route: child.route,
                                    sourceKind: child.sourceKind || 'registry',
                                    producerName:
                                      child.producerName || 'lab_nested',
                                    version: child.version || 'v1',
                                    manifestUrl: child.manifestUrl,
                                    expose: child.expose,
                                    render: child.render,
                                    stationProp: child.props?.station || '',
                                  },
                                })
                              }
                            >
                              <PencilIcon />
                            </button>
                            <button
                              type="button"
                              className={`jo-icon-btn ${child.enabled ? 'danger' : ''}`}
                              data-testid={`toggle-child-app-${child.id}`}
                              aria-label={
                                child.enabled ? '删除子路由' : '恢复子路由'
                              }
                              title={
                                child.enabled
                                  ? '删除子路由（访问将命中 404）'
                                  : '恢复子路由'
                              }
                              onClick={() =>
                                removeOrToggleChildApp(childSourceName, child)
                              }
                            >
                              {child.enabled ? <TrashIcon /> : <RestoreIcon />}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {editorTarget && platformState && (
          <RouteEditorModal
            target={editorTarget}
            registry={registry}
            siblingRoutes={modalSiblingRoutes}
            presets={platformState.presets}
            onClose={() => setEditorTarget(null)}
            onConfirm={handleModalConfirm}
          />
        )}
      </div>
    </LabLayout>
  );
}
