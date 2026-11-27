import { useSearchParams } from '@modern-js/runtime/router';
import { useCallback, useEffect, useRef, useState } from 'react';
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

interface PortalPlatformConfig {
  consumer: string;
  applications: PlatformAppConfig[];
}

interface ChildPlatformConfig {
  consumer: string;
  consumerManifestUrl?: string;
  applications: PlatformAppConfig[];
}

interface DiscoveryHttpLog {
  id: string;
  time: string;
  env: string;
  source: string;
  pathname: string;
  basename: string;
  status: number;
  sid?: string;
  deliveryMode?: 'full' | 'layered';
  partialRoot?: boolean;
  returnedRoutes?: Array<{
    route: string;
    moduleName: string;
    expose: string;
    discoverChildren: boolean;
  }>;
  bundledChildren?: Array<{
    key: string;
    consumer: string;
    sid?: string;
    routes: string[];
  }>;
  moduleInfoKeys?: string[];
  error?: string;
}

interface PlatformStateResponse {
  computedDelivery: {
    mode: 'full' | 'layered';
    portalLayered: boolean;
    childLayered: boolean;
  };
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
          discoverChildren: boolean;
        }>;
        routeDelivery?: Record<string, 'full' | 'layered'>;
        moduleInfoKeys: string[];
      } | null;
    };
  };
  logs: DiscoveryHttpLog[];
}

interface ClientTraceEntry {
  id: string;
  env: 'browser' | 'ssr';
  pathname: string;
  basename: string;
  consumer: string;
  source: string;
  fetchKind: 'http' | 'bundled-memory' | 'fixed-memory' | 'root-cache';
  durationMs: number;
  routes: string[];
  error?: string;
}

interface ClientRuntimeTelemetry {
  hydratedFromSSR: boolean;
  acceptedSids: Record<string, string>;
  registeredRemotes: Array<{ name: string; entry?: string; version?: string }>;
  traces: ClientTraceEntry[];
}

function deploymentApiBase(): string {
  return process.env.MF_LAB_API || '';
}

function defaultConsumerOrigin(): string {
  return process.env.MF_LAB_CONSUMER || 'http://localhost:4308';
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

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M2.5 4.5h11M2.5 11.5h11" strokeLinecap="round" />
      <circle cx="5.5" cy="4.5" r="1.5" fill="currentColor" />
      <circle cx="10.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4.5 3.5 12 8l-7.5 4.5v-9Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ApplicationsWorkbench() {
  const [params] = useSearchParams();
  const activeTab = params.get('tab') === 'platform' ? 'platform' : 'preview';

  const [platformState, setPlatformState] = useState<PlatformStateResponse>();
  const [portalDraft, setPortalDraft] = useState<PortalPlatformConfig>();
  const [childDraft, setChildDraft] = useState<ChildPlatformConfig>();
  const [addressPath, setAddressPath] = useState('/products');
  const [currentConsumerPath, setCurrentConsumerPath] = useState('/products');
  const [iframeSrc, setIframeSrc] = useState(
    () => `${defaultConsumerOrigin()}/products`,
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [telemetry, setTelemetry] = useState<ClientRuntimeTelemetry>();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [railView, setRailView] = useState<'http' | 'runtime'>('http');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    }, 1200);
    return () => clearInterval(timer);
  }, [fetchState]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'mf-lab-apps-trace') {
        setTelemetry(data.telemetry as ClientRuntimeTelemetry);
        if (typeof data.pathname === 'string') {
          setCurrentConsumerPath(data.pathname);
          setAddressPath(data.pathname);
        }
        void fetchState(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [fetchState]);

  const buildConsumerUrl = (pathname: string) => {
    const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
    return new URL(clean, consumerOrigin).toString();
  };

  const hardLoadConsumer = (pathname: string) => {
    const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
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

  const clearLogs = async () => {
    await fetch(`${deploymentApiBase()}/_lab/deployments/logs/clear`, {
      method: 'POST',
    });
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'mf-lab-apps-clear-traces' },
      '*',
    );
    await fetchState(false);
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
      setNotice(`配置已发布（自动计算下发模式：${modeLabel}）`);
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
      setNotice(
        `嵌套子层已独立发布（${data.sources['weather-children'].active?.sid}），根部署 sid 保持不变`,
      );
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
      setNotice('已恢复默认全量配置');
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
  const httpLogs = platformState?.logs || [];

  // Computed delivery mode from active published routes
  const activeMode = platformState?.computedDelivery?.mode || 'full';

  // Live preview of computed delivery mode from current draft routes in Platform tab
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

  const weatherPrefix =
    portalActive?.routes
      .find(r => r.expose === './WeatherApplication' || r.discoverChildren)
      ?.route.replace(/\/?\*$/, '')
      .replace(/^\/+/, '') || 'weather';
  const productPrefix =
    portalActive?.routes
      .find(r => r.expose === './ProductApp' || r.expose === './OrdersApp')
      ?.route.replace(/\/?\*$/, '')
      .replace(/^\/+/, '') || 'products';
  const childPrefix =
    childActive?.routes[0]?.route.replace(/\/?\*$/, '').replace(/^\/+/, '') ||
    'wind';

  const quickRoutes = [
    {
      id: 'b',
      label: `B · /${productPrefix}`,
      path: `/${productPrefix}`,
      active: currentConsumerPath.startsWith(`/${productPrefix}`),
    },
    {
      id: 'a',
      label: `A · /${weatherPrefix}/overview`,
      path: `/${weatherPrefix}/overview`,
      active:
        currentConsumerPath.startsWith(`/${weatherPrefix}`) &&
        !currentConsumerPath.includes(`/${childPrefix}`),
    },
    {
      id: 'nested',
      label: `嵌套 · /${weatherPrefix}/${childPrefix}/gusts`,
      path: `/${weatherPrefix}/${childPrefix}/gusts`,
      active: currentConsumerPath.includes(`/${childPrefix}`),
    },
  ];

  const weatherAppDraft = portalDraft?.applications.find(
    a => a.id === 'weather',
  );

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
            {activeTab === 'platform' && (
              <a
                href="/?lab=apps&tab=preview"
                className="jo-icon-btn"
                data-testid="goto-preview-tab"
              >
                <PlayIcon />
                去应用渲染
              </a>
            )}
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
                    aria-label="Quick routes"
                  >
                    {quickRoutes.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`nav-quick-${item.id}`}
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
                      flex: '1 1 200px',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      className="jo-input-capsule"
                      style={{ flex: '1 1 160px', maxWidth: '260px' }}
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
                      onClick={async () => {
                        await clearLogs();
                        hardLoadConsumer(addressPath);
                      }}
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

              {/* Quiet Observation Rail */}
              <aside className="jo-trace-rail" aria-label="Discovery trace">
                <div className="jo-rail-head">
                  <span className="jo-pill" data-testid="active-delivery-mode">
                    <span
                      className={`jo-dot ${activeMode === 'full' ? 'ok' : 'info'}`}
                    />
                    {activeMode === 'full' ? '全量下发' : '分层下发'}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <a
                      href="/?lab=apps&tab=platform"
                      className="jo-icon-btn"
                      data-testid="goto-platform-tab"
                      aria-label="部署配置"
                      title="修改部署路由与下发方式"
                    >
                      <SlidersIcon />
                    </a>
                    <button
                      type="button"
                      className="jo-icon-btn"
                      data-testid="clear-discovery-logs"
                      aria-label="清空日志"
                      title="清空日志"
                      onClick={() => void clearLogs()}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="jo-metrics-strip">
                  <div className="jo-metric">
                    <span className="jo-metric-label">HTTP</span>
                    <span
                      className="jo-metric-val"
                      data-testid="http-log-count"
                    >
                      {httpLogs.length}
                    </span>
                  </div>
                  <div className="jo-metric">
                    <span className="jo-metric-label">load()</span>
                    <span
                      className="jo-metric-val"
                      data-testid="hook-trace-count"
                    >
                      {telemetry?.traces.length ?? 0}
                    </span>
                  </div>
                  <div className="jo-metric">
                    <span className="jo-metric-label">Remotes</span>
                    <span className="jo-metric-val">
                      {telemetry?.registeredRemotes.length ?? 0}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 14px',
                    borderBottom: '1px solid var(--jo-border-hairline)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div className="jo-segmented">
                    <button
                      type="button"
                      className={`jo-seg-btn ${railView === 'http' ? 'active' : ''}`}
                      onClick={() => setRailView('http')}
                    >
                      下发请求
                    </button>
                    <button
                      type="button"
                      className={`jo-seg-btn ${railView === 'runtime' ? 'active' : ''}`}
                      onClick={() => setRailView('runtime')}
                    >
                      运行时
                    </button>
                  </div>
                  {telemetry && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--jo-text-muted)',
                      }}
                    >
                      {telemetry.hydratedFromSSR ? 'SSR 水合' : 'CSR'}
                    </span>
                  )}
                </div>

                <div
                  className="jo-trace-list"
                  data-testid={
                    railView === 'http' ? 'http-log-list' : 'runtime-trace-list'
                  }
                >
                  {railView === 'http' ? (
                    httpLogs.length === 0 ? (
                      <div
                        style={{
                          padding: '20px 14px',
                          fontSize: '12px',
                          color: 'var(--jo-text-muted)',
                        }}
                      >
                        点击刷新按钮开始记录平台下发请求。
                      </div>
                    ) : (
                      httpLogs.map(log => {
                        const expanded = expandedLogId === log.id;
                        const hasBundled = Boolean(log.bundledChildren?.length);
                        return (
                          <div
                            key={log.id}
                            className="jo-trace-row"
                            onClick={() =>
                              setExpandedLogId(expanded ? null : log.id)
                            }
                          >
                            <div className="jo-trace-row-top">
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <span
                                  className={`jo-dot ${log.status === 200 ? (hasBundled ? 'ok' : 'info') : 'danger'}`}
                                />
                                {log.source} · {log.pathname}
                              </span>
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: 'var(--jo-text-muted)',
                                }}
                              >
                                {log.env}
                              </span>
                            </div>
                            <div className="jo-trace-row-sub">
                              <span>
                                {(log.returnedRoutes || [])
                                  .map(r => r.route)
                                  .join(', ') || '(无路由)'}
                              </span>
                              <span>
                                {log.status === 409
                                  ? '409 过期'
                                  : hasBundled
                                    ? '含嵌套子层'
                                    : '仅当前层'}
                              </span>
                            </div>
                            {expanded && (
                              <div className="jo-trace-expand">
                                <div>sid: {log.sid || '-'}</div>
                                <div>
                                  moduleInfo: [
                                  {(log.moduleInfoKeys || []).join(', ')}]
                                </div>
                                {hasBundled && (
                                  <div>
                                    bundled:{' '}
                                    {log.bundledChildren
                                      ?.map(c => c.routes.join(', '))
                                      .join('; ')}
                                  </div>
                                )}
                                {log.error && <div>error: {log.error}</div>}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )
                  ) : (
                    <>
                      <div className="jo-trace-row">
                        <div className="jo-trace-row-top">
                          <span>已注册 MF Remotes</span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--jo-text-muted)',
                            }}
                          >
                            {telemetry?.registeredRemotes.length ?? 0}
                          </span>
                        </div>
                        <div className="jo-trace-row-sub">
                          <span>
                            {telemetry?.registeredRemotes.length
                              ? telemetry.registeredRemotes
                                  .map(r => r.name)
                                  .join(', ')
                              : '(空)'}
                          </span>
                        </div>
                      </div>
                      {(telemetry?.traces || []).map(trace => (
                        <div key={trace.id} className="jo-trace-row">
                          <div className="jo-trace-row-top">
                            <span>{trace.consumer}</span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--jo-text-muted)',
                              }}
                            >
                              {trace.fetchKind} · {trace.durationMs}ms
                            </span>
                          </div>
                          <div className="jo-trace-row-sub">
                            <span>{trace.pathname}</span>
                            <span>{trace.routes.length} routes</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="jo-rail-foot">
                  {activeMode === 'full'
                    ? '全量模式：刷新 B 后再切 A 与嵌套页，HTTP 保持 1 次。'
                    : '分层模式：刷新 B 仅下发当前层，切到 A / 嵌套页时按需触发新 HTTP。'}
                </div>
              </aside>
            </div>
          </div>
        ) : (
          /* Tab 2: Route-Centric Deployment Configuration */
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
                {portalActive && (
                  <span className="jo-pill" data-testid="active-portal-sid">
                    {portalActive.sid}
                  </span>
                )}
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
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
                <a
                  href="/?lab=apps&tab=preview"
                  className="jo-icon-btn"
                  data-testid="goto-preview-tab"
                >
                  <PlayIcon />
                  应用渲染
                </a>
              </div>
            </div>

            <div className="jo-route-table-head">
              <span>路由路径</span>
              <span>生产者与导出</span>
              <span>下发方式</span>
              <span style={{ textAlign: 'right' }}>操作</span>
            </div>

            <div>
              {portalDraft?.applications.map(app => (
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
                      <span className="jo-pill">lab_provider</span>
                      <div
                        className="jo-input-capsule"
                        style={{ minWidth: '170px' }}
                      >
                        <select
                          aria-label={`${app.id} expose`}
                          data-testid={`expose-select-${app.id}`}
                          value={app.expose}
                          onChange={e =>
                            updatePortalApp(app.id, { expose: e.target.value })
                          }
                        >
                          {app.id === 'weather' ? (
                            <>
                              <option value="./WeatherApplication">
                                ./WeatherApplication
                              </option>
                              <option value="./Weather">./Weather</option>
                            </>
                          ) : (
                            <>
                              <option value="./ProductApp">./ProductApp</option>
                              <option value="./OrdersApp">./OrdersApp</option>
                            </>
                          )}
                        </select>
                      </div>
                      {platformState?.presets.providerV2 && (
                        <div
                          className="jo-input-capsule"
                          style={{ width: '74px' }}
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
                            <option value={platformState.presets.providerV1}>
                              v1
                            </option>
                            <option value={platformState.presets.providerV2}>
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
                          app.enabled ? '删除该路由（命中 404）' : '恢复该路由'
                        }
                        title={
                          app.enabled
                            ? '删除该路由（访问将命中 404）'
                            : '恢复该路由'
                        }
                        onClick={() =>
                          updatePortalApp(app.id, { enabled: !app.enabled })
                        }
                      >
                        {app.enabled ? <TrashIcon /> : <RestoreIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Nested child routes rendered directly beneath Producer A */}
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
                          <div className="jo-input-capsule" style={{ flex: 1 }}>
                            <span
                              style={{
                                color: 'var(--jo-text-muted)',
                                fontSize: '11px',
                              }}
                            >
                              /{app.route.replace(/\/?\*$/, '')}/
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
                              title={`独立发布子层 (${childActive?.sid || ''})`}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </LabLayout>
  );
}
