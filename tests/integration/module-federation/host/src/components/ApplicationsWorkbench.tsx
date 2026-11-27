import { useSearchParams } from '@modern-js/runtime/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LabLayout } from './LabLayout';
import './ApplicationsWorkbench.css';

interface PlatformAppConfig {
  id: string;
  title: string;
  enabled: boolean;
  route: string;
  manifestUrl: string;
  expose: string;
  delivery: 'full' | 'layered';
  childrenMode: 'dynamic' | 'fixed' | 'none';
  childrenSource?: string;
  fixedDeploymentId?: string;
  props?: Record<string, string>;
}

interface CatalogEntry {
  producer: string;
  label: string;
  manifestUrl: string;
  expose: string;
  defaultRoute: string;
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
    portalLayered: boolean;
    childLayered: boolean;
  };
  catalog: CatalogEntry[];
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
        deploymentId: string;
        sid: string;
        deliveryMode: 'full' | 'layered';
        hasLayeredRoute: boolean;
        routes: Array<{
          route: string;
          moduleName: string;
          expose: string;
          versionOrUrl: string;
          discoverChildren: boolean;
        }>;
        routeDelivery?: Record<string, 'full' | 'layered'>;
        moduleInfoKeys: string[];
      } | null;
    };
    'weather-children': {
      config: ChildPlatformConfig;
      active: {
        deploymentId: string;
        sid: string;
        hasLayeredRoute: boolean;
        routes: Array<{
          route: string;
          moduleName: string;
          expose: string;
          versionOrUrl: string;
          discoverChildren: boolean;
        }>;
        routeDelivery?: Record<string, 'full' | 'layered'>;
        moduleInfoKeys: string[];
      } | null;
    };
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

function pathMatchesRoute(pathname: string, routePattern: string): boolean {
  const cleanPath = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  const prefix = stripRouteWildcard(routePattern);
  if (!prefix) return cleanPath === '';
  return cleanPath === prefix || cleanPath.startsWith(`${prefix}/`);
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

export function ApplicationsWorkbench() {
  const [params] = useSearchParams();
  const activeTab = params.get('tab') === 'platform' ? 'platform' : 'preview';

  const [platformState, setPlatformState] = useState<PlatformStateResponse>();
  const [portalDraft, setPortalDraft] = useState<PortalPlatformConfig>();
  const [childDraft, setChildDraft] = useState<ChildPlatformConfig>();
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
        setPortalDraft(structuredClone(data.sources.portal.config));
        setChildDraft(structuredClone(data.sources['weather-children'].config));
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

  const publishAll = async () => {
    if (!portalDraft || !childDraft) return;
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const response = await fetch(
        `${deploymentApiBase()}/_lab/deployments/publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portal: portalDraft, children: childDraft }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Publish failed (${response.status})`);
      }
      setPlatformState(data as PlatformStateResponse);
      setPortalDraft(structuredClone(data.sources.portal.config));
      setChildDraft(structuredClone(data.sources['weather-children'].config));
      const modeLabel =
        data.computedDelivery?.mode === 'full' ? '全量下发' : '分层下发';
      setNotice(`已发布 · 当前按路由计算为「${modeLabel}」`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const publishChildOnly = async () => {
    if (!childDraft) return;
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
            source: 'weather-children',
            config: childDraft,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Publish failed (${response.status})`);
      }
      setPlatformState(data as PlatformStateResponse);
      setChildDraft(structuredClone(data.sources['weather-children'].config));
      setNotice('嵌套子层已独立发布');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
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
      setPlatformState(data);
      setPortalDraft(structuredClone(data.sources.portal.config));
      setChildDraft(structuredClone(data.sources['weather-children'].config));
      setNotice('已恢复默认配置');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const updatePortalApp = (id: string, patch: Partial<PlatformAppConfig>) => {
    setPortalDraft(prev =>
      prev
        ? {
            ...prev,
            applications: prev.applications.map(app =>
              app.id === id ? { ...app, ...patch } : app,
            ),
          }
        : prev,
    );
  };

  const addPortalRoute = () => {
    const catalog = platformState?.catalog || [];
    const existingRoutes = new Set(
      (portalDraft?.applications || []).map(a => stripRouteWildcard(a.route)),
    );
    const candidate =
      catalog.find(
        item => !existingRoutes.has(stripRouteWildcard(item.defaultRoute)),
      ) || catalog[0];
    if (!candidate) return;
    const base = stripRouteWildcard(candidate.defaultRoute) || 'app';
    let route = `${base}/*`;
    let suffix = 2;
    while (existingRoutes.has(stripRouteWildcard(route))) {
      route = `${base}-${suffix++}/*`;
    }
    const id = `custom-${Date.now()}`;
    setPortalDraft(prev =>
      prev
        ? {
            ...prev,
            applications: [
              ...prev.applications,
              {
                id,
                title: candidate.label,
                enabled: true,
                route,
                manifestUrl: candidate.manifestUrl,
                expose: candidate.expose,
                delivery: 'full',
                childrenMode: 'none',
                props: {},
              },
            ],
          }
        : prev,
    );
  };

  const removeOrTogglePortalApp = (app: PlatformAppConfig) => {
    if (app.id.startsWith('custom-')) {
      setPortalDraft(prev =>
        prev
          ? {
              ...prev,
              applications: prev.applications.filter(a => a.id !== app.id),
            }
          : prev,
      );
    } else {
      updatePortalApp(app.id, { enabled: !app.enabled });
    }
  };

  const updateChildApp = (id: string, patch: Partial<PlatformAppConfig>) => {
    setChildDraft(prev =>
      prev
        ? {
            ...prev,
            applications: prev.applications.map(app =>
              app.id === id ? { ...app, ...patch } : app,
            ),
          }
        : prev,
    );
  };

  const portalActive = platformState?.sources.portal.active;
  const childActive = platformState?.sources['weather-children'].active;
  const activeMode = platformState?.computedDelivery?.mode || 'full';
  const catalog = platformState?.catalog || [];

  const draftHasLayered =
    Boolean(
      portalDraft?.applications.some(
        app => app.enabled && app.delivery === 'layered',
      ),
    ) ||
    Boolean(
      portalDraft?.applications.some(
        app =>
          app.id === 'weather' && app.enabled && app.childrenMode === 'dynamic',
      ) &&
      childDraft?.applications.some(
        app => app.enabled && app.delivery === 'layered',
      ),
    );

  // Dynamically generate clickable quick-nav pills from currently published routes
  const quickRoutes = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      path: string;
      active: boolean;
    }> = [];
    for (const r of portalActive?.routes || []) {
      const prefix = stripRouteWildcard(r.route);
      if (!prefix) continue;
      if (r.expose === './WeatherApplication') {
        const overviewPath = `/${prefix}/overview`;
        const childPrefix = stripRouteWildcard(
          childActive?.routes[0]?.route || 'wind/*',
        );
        items.push({
          id: `root-${prefix}`,
          label: `/${prefix}`,
          path: overviewPath,
          active:
            currentConsumerPath.startsWith(`/${prefix}`) &&
            (!childPrefix ||
              !currentConsumerPath.startsWith(`/${prefix}/${childPrefix}`)),
        });
        if (r.discoverChildren && childActive?.routes.length) {
          const nestedPath = `/${prefix}/${childPrefix}/gusts`;
          items.push({
            id: `nested-${prefix}-${childPrefix}`,
            label: `嵌套 /${prefix}/${childPrefix}`,
            path: nestedPath,
            active: currentConsumerPath.startsWith(`/${prefix}/${childPrefix}`),
          });
        }
      } else {
        const target = `/${prefix}`;
        items.push({
          id: `root-${prefix}`,
          label: target,
          path: target,
          active: currentConsumerPath.startsWith(target),
        });
      }
    }
    return items;
  }, [portalActive, childActive, currentConsumerPath]);

  // Compute the active rendered module chain for the current URL
  const activeRenderChain = useMemo(() => {
    const chain: Array<{
      level: number;
      route: string;
      moduleName: string;
      expose: string;
      versionOrUrl: string;
      snapshotKey: string;
    }> = [];
    const matchedRoot = (portalActive?.routes || []).find(r =>
      pathMatchesRoute(currentConsumerPath, r.route),
    );
    if (!matchedRoot) return chain;
    chain.push({
      level: 0,
      route: `/${stripRouteWildcard(matchedRoot.route)}/*`,
      moduleName: matchedRoot.moduleName,
      expose: matchedRoot.expose,
      versionOrUrl: matchedRoot.versionOrUrl,
      snapshotKey: `${matchedRoot.moduleName}:${matchedRoot.versionOrUrl}`,
    });
    if (matchedRoot.discoverChildren) {
      const rootPrefix = stripRouteWildcard(matchedRoot.route);
      const rest = currentConsumerPath
        .replace(/^\/+/, '')
        .slice(rootPrefix.length)
        .replace(/^\/+/, '');
      const matchedChild = (childActive?.routes || []).find(c =>
        pathMatchesRoute(rest, c.route),
      );
      if (matchedChild) {
        chain.push({
          level: 1,
          route: `/${rootPrefix}/${stripRouteWildcard(matchedChild.route)}/*`,
          moduleName: matchedChild.moduleName,
          expose: matchedChild.expose,
          versionOrUrl: matchedChild.versionOrUrl,
          snapshotKey: `${matchedChild.moduleName}:${matchedChild.versionOrUrl}`,
        });
      }
    }
    return chain;
  }, [portalActive, childActive, currentConsumerPath]);

  const activeModuleNames = useMemo(
    () => new Set(activeRenderChain.map(item => item.moduleName)),
    [activeRenderChain],
  );
  const activeSnapshotKeys = useMemo(
    () => new Set(activeRenderChain.map(item => item.snapshotKey)),
    [activeRenderChain],
  );

  const weatherAppDraft = portalDraft?.applications.find(
    a => a.id === 'weather',
  );

  const producerLabelForUrl = (url: string) =>
    platformState?.presets.nested && url === platformState.presets.nested
      ? 'lab_nested'
      : 'lab_provider';

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

              {/* Right Module Info Inspector: Active Render + globalModuleInfo + Nested + Diff */}
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

                {/* 1. Currently Rendered moduleInfo (Highlighted) */}
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

                {/* 2. globalModuleInfo Snapshot + Nested + Incremental Diff Highlight */}
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

                          {/* Nested remotesInfo dependencies */}
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

                          {/* Full-delivery pre-bundled nested children */}
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
                    ? '当前为全量下发：嵌套子层已随首屏预下发；切到嵌套页无需新增模块。'
                    : '当前为分层下发：切到未加载的路由或嵌套页时，新增模块会以绿色「+ 新增」高亮。'}
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
                  disabled={busy || catalog.length === 0}
                  data-testid="add-portal-route"
                  onClick={addPortalRoute}
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
              <span>下发方式</span>
              <span style={{ textAlign: 'right' }}>操作</span>
            </div>

            <div>
              {portalDraft?.applications.map(app => {
                const currentProducer = producerLabelForUrl(app.manifestUrl);
                const matchingCatalog = catalog.filter(
                  c => c.producer === currentProducer,
                );
                return (
                  <div key={app.id}>
                    <div
                      data-testid={`portal-app-${app.id}`}
                      className={`jo-route-row ${app.enabled ? '' : 'removed'}`}
                    >
                      <div className="jo-route-path-cell">
                        <span
                          className={`jo-dot ${app.enabled ? (app.delivery === 'full' ? 'ok' : 'info') : 'danger'}`}
                        />
                        <div className="jo-input-capsule" style={{ flex: 1 }}>
                          <span
                            style={{
                              color: 'var(--jo-text-muted)',
                              fontSize: '12px',
                            }}
                          >
                            /
                          </span>
                          <input
                            className="mono"
                            aria-label={`${app.id} route`}
                            data-testid={`route-input-${app.id}`}
                            value={app.route}
                            onChange={e =>
                              updatePortalApp(app.id, { route: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="jo-producer-cell">
                        <div
                          className="jo-input-capsule"
                          style={{ width: '116px' }}
                        >
                          <select
                            aria-label={`${app.id} producer`}
                            value={currentProducer}
                            onChange={e => {
                              const nextProducer = e.target.value;
                              const first = catalog.find(
                                c => c.producer === nextProducer,
                              );
                              if (first) {
                                updatePortalApp(app.id, {
                                  manifestUrl: first.manifestUrl,
                                  expose: first.expose,
                                });
                              }
                            }}
                          >
                            <option value="lab_provider">lab_provider</option>
                            {platformState?.presets.nested && (
                              <option value="lab_nested">lab_nested</option>
                            )}
                          </select>
                        </div>

                        <div
                          className="jo-input-capsule"
                          style={{ minWidth: '175px' }}
                        >
                          <select
                            aria-label={`${app.id} expose`}
                            data-testid={`expose-select-${app.id}`}
                            value={app.expose}
                            onChange={e =>
                              updatePortalApp(app.id, {
                                expose: e.target.value,
                              })
                            }
                          >
                            {matchingCatalog.map(item => (
                              <option key={item.expose} value={item.expose}>
                                {item.expose}
                              </option>
                            ))}
                          </select>
                        </div>

                        {currentProducer === 'lab_provider' &&
                          platformState?.presets.providerV2 && (
                            <div
                              className="jo-input-capsule"
                              style={{ width: '66px' }}
                            >
                              <select
                                aria-label={`${app.id} version`}
                                data-testid={`version-select-${app.id}`}
                                value={app.manifestUrl}
                                onChange={e =>
                                  updatePortalApp(app.id, {
                                    manifestUrl: e.target.value,
                                  })
                                }
                              >
                                <option
                                  value={platformState.presets.providerV1}
                                >
                                  v1
                                </option>
                                <option
                                  value={platformState.presets.providerV2}
                                >
                                  v2
                                </option>
                              </select>
                            </div>
                          )}
                      </div>

                      <div>
                        <div
                          className="jo-segmented"
                          role="group"
                          aria-label={`${app.id} delivery`}
                        >
                          <button
                            type="button"
                            data-testid={`delivery-full-${app.id}`}
                            className={`jo-seg-btn ${app.delivery === 'full' ? 'active' : ''}`}
                            onClick={() =>
                              updatePortalApp(app.id, { delivery: 'full' })
                            }
                          >
                            全量
                          </button>
                          <button
                            type="button"
                            data-testid={`delivery-layered-${app.id}`}
                            className={`jo-seg-btn ${app.delivery === 'layered' ? 'active' : ''}`}
                            onClick={() =>
                              updatePortalApp(app.id, { delivery: 'layered' })
                            }
                          >
                            分层
                          </button>
                        </div>
                      </div>

                      <div className="jo-actions-cell">
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

                    {/* Nested child routes directly beneath Producer A */}
                    {app.id === 'weather' &&
                      app.enabled &&
                      childDraft?.applications.map(child => (
                        <div
                          key={child.id}
                          data-testid={`child-app-${child.id}`}
                          className={`jo-route-row nested ${child.enabled ? '' : 'removed'}`}
                        >
                          <div className="jo-route-path-cell">
                            <span className="jo-tree-elbow">└</span>
                            <span
                              className={`jo-dot ${child.enabled ? (child.delivery === 'full' ? 'ok' : 'info') : 'danger'}`}
                            />
                            <div
                              className="jo-input-capsule"
                              style={{ flex: 1 }}
                            >
                              <span
                                style={{
                                  color: 'var(--jo-text-muted)',
                                  fontSize: '11px',
                                }}
                              >
                                /{stripRouteWildcard(app.route)}/
                              </span>
                              <input
                                className="mono"
                                aria-label={`${child.id} nested route`}
                                data-testid={`child-route-input-${child.id}`}
                                value={child.route}
                                onChange={e =>
                                  updateChildApp(child.id, {
                                    route: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="jo-producer-cell">
                            <span className="jo-pill">lab_nested</span>
                            <span className="jo-pill">{child.expose}</span>
                            <div
                              className="jo-input-capsule"
                              style={{ width: '132px' }}
                            >
                              <input
                                aria-label="Station prop"
                                placeholder="station"
                                data-testid={`child-prop-station-${child.id}`}
                                value={child.props?.station || ''}
                                onChange={e =>
                                  updateChildApp(child.id, {
                                    props: {
                                      ...child.props,
                                      station: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <div
                              className="jo-segmented"
                              role="group"
                              aria-label={`${child.id} delivery`}
                            >
                              <button
                                type="button"
                                data-testid={`delivery-full-${child.id}`}
                                className={`jo-seg-btn ${child.delivery === 'full' ? 'active' : ''}`}
                                onClick={() =>
                                  updateChildApp(child.id, { delivery: 'full' })
                                }
                              >
                                全量
                              </button>
                              <button
                                type="button"
                                data-testid={`delivery-layered-${child.id}`}
                                className={`jo-seg-btn ${child.delivery === 'layered' ? 'active' : ''}`}
                                onClick={() =>
                                  updateChildApp(child.id, {
                                    delivery: 'layered',
                                  })
                                }
                              >
                                分层
                              </button>
                            </div>
                          </div>

                          <div className="jo-actions-cell">
                            {weatherAppDraft?.childrenMode === 'dynamic' && (
                              <button
                                type="button"
                                className="jo-icon-btn"
                                disabled={busy}
                                data-testid="publish-children"
                                aria-label="独立发布该嵌套子层"
                                title="独立发布该嵌套子层"
                                onClick={() => void publishChildOnly()}
                              >
                                <RefreshIcon />
                              </button>
                            )}
                            <button
                              type="button"
                              className={`jo-icon-btn ${child.enabled ? 'danger' : ''}`}
                              data-testid={`toggle-child-app-${child.id}`}
                              aria-label={
                                child.enabled ? '删除嵌套路由' : '恢复嵌套路由'
                              }
                              title={
                                child.enabled
                                  ? '删除嵌套路由（访问将命中 404）'
                                  : '恢复嵌套路由'
                              }
                              onClick={() =>
                                updateChildApp(child.id, {
                                  enabled: !child.enabled,
                                })
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
      </div>
    </LabLayout>
  );
}
