import { useCallback, useEffect, useRef, useState } from 'react';
import { LabLayout } from './LabLayout';
import { Button, Checkbox, Select, SelectItem } from './ui/controls';
import './ApplicationsWorkbench.css';

interface PlatformAppConfig {
  id: string;
  title: string;
  enabled: boolean;
  route: string;
  manifestUrl: string;
  expose: string;
  childrenMode: 'dynamic' | 'fixed' | 'none';
  childrenSource?: string;
  fixedDeploymentId?: string;
  props?: Record<string, string>;
}

interface PortalPlatformConfig {
  consumer: string;
  deliveryMode: 'full' | 'layered';
  pathClipped: boolean;
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
  expectedSid?: string;
  deliveryMode?: string;
  pathClipped?: boolean;
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
  fixedChildren?: Array<{
    key: string;
    consumer: string;
    sid?: string;
    routes: string[];
  }>;
  moduleInfoKeys?: string[];
  error?: string;
}

interface PlatformStateResponse {
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
        pathClipped: boolean;
        routes: Array<{
          route: string;
          moduleName: string;
          expose: string;
          discoverChildren: boolean;
        }>;
        moduleInfoKeys: string[];
      } | null;
      history: Array<{
        deploymentId: string;
        sid: string;
        publishedAt: string;
        summary: string;
      }>;
    };
    'weather-children': {
      config: ChildPlatformConfig;
      active: {
        deploymentId: string;
        sid: string;
        routes: Array<{
          route: string;
          moduleName: string;
          expose: string;
          discoverChildren: boolean;
        }>;
        moduleInfoKeys: string[];
      } | null;
      history: Array<{
        deploymentId: string;
        sid: string;
        publishedAt: string;
        summary: string;
      }>;
    };
  };
  logs: DiscoveryHttpLog[];
}

interface ClientTraceEntry {
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

interface ClientRuntimeTelemetry {
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

function deploymentApiBase(): string {
  return process.env.MF_LAB_API || '';
}

function defaultConsumerOrigin(): string {
  return process.env.MF_LAB_CONSUMER || 'http://localhost:4308';
}

export function ApplicationsWorkbench() {
  const [platformState, setPlatformState] = useState<PlatformStateResponse>();
  const [portalDraft, setPortalDraft] = useState<PortalPlatformConfig>();
  const [childDraft, setChildDraft] = useState<ChildPlatformConfig>();
  const [expiredPolicy, setExpiredPolicy] = useState<'reload' | 'defer'>(
    'reload',
  );
  const [useCSRQuery, setUseCSRQuery] = useState(false);
  const [addressPath, setAddressPath] = useState('/products');
  const [iframeSrc, setIframeSrc] = useState(
    () => `${defaultConsumerOrigin()}/products`,
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [inspectorTab, setInspectorTab] = useState<'http' | 'runtime'>('http');
  const [telemetry, setTelemetry] = useState<ClientRuntimeTelemetry>();
  const [currentConsumerPath, setCurrentConsumerPath] = useState('/products');
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

  const buildConsumerUrl = (pathname: string, csr = useCSRQuery) => {
    const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const url = new URL(clean, consumerOrigin);
    if (csr) url.searchParams.set('csr', '1');
    return url.toString();
  };

  const hardLoadConsumer = (pathname: string, csr = useCSRQuery) => {
    const nextUrl = buildConsumerUrl(pathname, csr);
    setAddressPath(pathname);
    setCurrentConsumerPath(pathname);
    setIframeSrc(nextUrl);
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

  const triggerRediscover = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'mf-lab-apps-rediscover', pathname: currentConsumerPath },
      '*',
    );
  };

  const applyExpiredPolicy = (policy: 'reload' | 'defer') => {
    setExpiredPolicy(policy);
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'mf-lab-apps-set-expired-policy', policy },
      '*',
    );
  };

  const publishSource = async (
    source: 'portal' | 'weather-children',
    config: PortalPlatformConfig | ChildPlatformConfig,
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
          body: JSON.stringify({ source, config }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Publish failed (${response.status})`);
      }
      setPlatformState(data as PlatformStateResponse);
      setPortalDraft(structuredClone(data.sources.portal.config));
      setChildDraft(structuredClone(data.sources['weather-children'].config));
      const newSid = data.sources[source]?.active?.sid || '';
      setNotice(
        source === 'portal'
          ? `Published root deployment (${newSid}, mode=${data.sources.portal.active?.deliveryMode}${data.sources.portal.active?.pathClipped ? '+pathClipped' : ''}).`
          : `Published nested child deployment "${source}" (${newSid}). Root portal sid remains unchanged.`,
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
      setNotice(
        'Reset platform to default Full delivery with A (nested C) + B.',
      );
      hardLoadConsumer('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
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

  // Derive dynamic quick-navigation paths from currently active config so renaming routes works smoothly.
  const weatherRoutePrefix =
    portalActive?.routes
      .find(r => r.expose === './WeatherApplication' || r.discoverChildren)
      ?.route.replace(/\/?\*$/, '')
      .replace(/^\/+/, '') || 'weather';
  const productRoutePrefix =
    portalActive?.routes
      .find(r => r.expose === './ProductApp' || r.expose === './OrdersApp')
      ?.route.replace(/\/?\*$/, '')
      .replace(/^\/+/, '') || 'products';
  const childRoutePrefix =
    childActive?.routes[0]?.route.replace(/\/?\*$/, '').replace(/^\/+/, '') ||
    'wind';

  return (
    <LabLayout
      section="apps"
      title="App discovery"
      description="Configure deployment delivery (Full vs Layered), nested applications, route revocation (404), and inspect real-time discovery requests."
    >
      <div className="apps-workbench">
        {notice && (
          <div className="apps-notice" data-testid="apps-notice">
            {notice}
          </div>
        )}
        {error && (
          <div className="apps-error" role="alert" data-testid="apps-error">
            {error}
          </div>
        )}

        {/* 1. Deployment Platform Controls */}
        <section
          className="apps-card"
          aria-label="Deployment platform controls"
        >
          <div className="apps-card-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <h2>Deployment Platform (Simulated Goofy / SDK Store)</h2>
              {portalActive && (
                <span
                  className={`apps-meta-pill ${portalActive.deliveryMode}`}
                  data-testid="active-delivery-mode"
                >
                  Active:{' '}
                  {portalActive.deliveryMode === 'full'
                    ? 'Full (全量下发)'
                    : 'Layered (分层下发)'}
                  {portalActive.pathClipped ? ' + Path-clipped' : ''}
                </span>
              )}
              {portalActive && (
                <span
                  className="apps-meta-pill"
                  data-testid="active-portal-sid"
                >
                  portal sid: {portalActive.sid}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                className="lab-primary"
                disabled={busy || !portalDraft}
                data-testid="publish-portal"
                onClick={() =>
                  portalDraft && void publishSource('portal', portalDraft)
                }
              >
                Publish Portal
              </Button>
              <Button
                disabled={busy}
                data-testid="reset-platform"
                onClick={() => void resetPlatform()}
              >
                Reset Defaults
              </Button>
            </div>
          </div>

          {portalDraft && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Delivery mode
                <Select
                  aria-label="Delivery mode"
                  data-testid="delivery-mode-select"
                  value={portalDraft.deliveryMode}
                  onValueChange={value =>
                    setPortalDraft(prev =>
                      prev
                        ? {
                            ...prev,
                            deliveryMode: value as 'full' | 'layered',
                          }
                        : prev,
                    )
                  }
                >
                  <SelectItem value="full">
                    Full · 全量下发 (root + bundled children)
                  </SelectItem>
                  <SelectItem value="layered">
                    Layered · 分层下发 (fetch child on demand)
                  </SelectItem>
                </Select>
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                <Checkbox
                  data-testid="path-clipped-checkbox"
                  checked={portalDraft.pathClipped}
                  onCheckedChange={checked =>
                    setPortalDraft(prev =>
                      prev ? { ...prev, pathClipped: Boolean(checked) } : prev,
                    )
                  }
                />
                Path-clipped · 同层按路径裁剪
              </label>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                On 409 expired
                <Select
                  aria-label="Expired policy"
                  data-testid="expired-policy-select"
                  value={expiredPolicy}
                  onValueChange={value =>
                    applyExpiredPolicy(value as 'reload' | 'defer')
                  }
                >
                  <SelectItem value="reload">Auto reload page</SelectItem>
                  <SelectItem value="defer">
                    Defer (keep current page)
                  </SelectItem>
                </Select>
              </label>
            </div>
          )}

          <div className="apps-platform-grid">
            {/* Root Consumer Portal Config */}
            <div>
              <div className="apps-card-header">
                <h3>Root Consumer (portal → A &amp; B)</h3>
                <span className="apps-meta-pill">
                  {portalDraft?.applications.filter(a => a.enabled).length ?? 0}{' '}
                  enabled
                </span>
              </div>

              {portalDraft?.applications.map(app => (
                <div
                  key={app.id}
                  data-testid={`portal-app-${app.id}`}
                  className={`apps-app-row ${app.enabled ? '' : 'disabled'}`}
                >
                  <div className="apps-app-row-top">
                    <strong style={{ fontSize: '12px' }}>{app.title}</strong>
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        className={`apps-meta-pill ${app.enabled ? 'ok' : 'err'}`}
                      >
                        {app.enabled ? 'Enabled' : 'Removed (404)'}
                      </span>
                      <Button
                        data-testid={`toggle-portal-app-${app.id}`}
                        onClick={() =>
                          updatePortalApp(app.id, { enabled: !app.enabled })
                        }
                      >
                        {app.enabled ? 'Remove / Disable' : 'Restore'}
                      </Button>
                    </div>
                  </div>
                  <div className="apps-app-fields">
                    <label className="apps-field">
                      Route pattern
                      <input
                        data-testid={`route-input-${app.id}`}
                        value={app.route}
                        onChange={e =>
                          updatePortalApp(app.id, { route: e.target.value })
                        }
                      />
                    </label>
                    <label className="apps-field">
                      Expose
                      <select
                        data-testid={`expose-select-${app.id}`}
                        value={app.expose}
                        onChange={e =>
                          updatePortalApp(app.id, { expose: e.target.value })
                        }
                      >
                        {app.id === 'weather' ? (
                          <>
                            <option value="./WeatherApplication">
                              ./WeatherApplication (Bridge)
                            </option>
                            <option value="./Weather">
                              ./Weather (Ordinary component)
                            </option>
                          </>
                        ) : (
                          <>
                            <option value="./ProductApp">
                              ./ProductApp (Bridge)
                            </option>
                            <option value="./OrdersApp">
                              ./OrdersApp (Bridge)
                            </option>
                          </>
                        )}
                      </select>
                    </label>
                    {platformState?.presets.providerV2 && (
                      <label className="apps-field">
                        Producer release
                        <select
                          data-testid={`version-select-${app.id}`}
                          value={app.manifestUrl}
                          onChange={e =>
                            updatePortalApp(app.id, {
                              manifestUrl: e.target.value,
                            })
                          }
                        >
                          <option value={platformState.presets.providerV1}>
                            provider v1
                          </option>
                          <option value={platformState.presets.providerV2}>
                            provider v2
                          </option>
                        </select>
                      </label>
                    )}
                    {app.id === 'weather' && (
                      <label className="apps-field">
                        Nested children
                        <select
                          data-testid="weather-children-mode"
                          value={app.childrenMode}
                          onChange={e =>
                            updatePortalApp(app.id, {
                              childrenMode: e.target.value as
                                'dynamic' | 'fixed' | 'none',
                            })
                          }
                        >
                          <option value="dynamic">
                            Dynamic child source (weather-children)
                          </option>
                          <option value="fixed">
                            Fixed child snapshot (pinned deploymentId)
                          </option>
                          <option value="none">Disabled (leaf)</option>
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Nested Child Deployment Config */}
            <div>
              <div className="apps-card-header">
                <h3>Producer A Nested Children (weather-children)</h3>
                <div
                  style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                >
                  {childActive && (
                    <span
                      className="apps-meta-pill"
                      data-testid="active-child-sid"
                    >
                      sid: {childActive.sid}
                    </span>
                  )}
                  <Button
                    disabled={busy || !childDraft}
                    data-testid="publish-children"
                    onClick={() =>
                      childDraft &&
                      void publishSource('weather-children', childDraft)
                    }
                  >
                    Publish Children
                  </Button>
                </div>
              </div>

              {childDraft?.applications.map(app => (
                <div
                  key={app.id}
                  data-testid={`child-app-${app.id}`}
                  className={`apps-app-row ${app.enabled ? '' : 'disabled'}`}
                >
                  <div className="apps-app-row-top">
                    <strong style={{ fontSize: '12px' }}>{app.title}</strong>
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        className={`apps-meta-pill ${app.enabled ? 'ok' : 'err'}`}
                      >
                        {app.enabled ? 'Enabled' : 'Removed (404)'}
                      </span>
                      <Button
                        data-testid={`toggle-child-app-${app.id}`}
                        onClick={() =>
                          updateChildApp(app.id, { enabled: !app.enabled })
                        }
                      >
                        {app.enabled ? 'Remove / Disable' : 'Restore'}
                      </Button>
                    </div>
                  </div>
                  <div className="apps-app-fields">
                    <label className="apps-field">
                      Nested route (relative to A)
                      <input
                        data-testid={`child-route-input-${app.id}`}
                        value={app.route}
                        onChange={e =>
                          updateChildApp(app.id, { route: e.target.value })
                        }
                      />
                    </label>
                    <label className="apps-field">
                      Station prop
                      <input
                        data-testid={`child-prop-station-${app.id}`}
                        value={app.props?.station || ''}
                        onChange={e =>
                          updateChildApp(app.id, {
                            props: { ...app.props, station: e.target.value },
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))}
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                Independent child deployment: publishing here updates{' '}
                <code>weather-children</code>&apos;s own <code>sid</code>{' '}
                without changing root <code>portal</code>&apos;s{' '}
                <code>sid</code>.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Bottom Split: Consumer Viewport + Real-time Discovery Inspector */}
        <div className="apps-runtime-split">
          <section className="apps-card" aria-label="Dynamic consumer preview">
            <div className="apps-card-header">
              <h2>Dynamic Consumer Viewport ({consumerOrigin})</h2>
              <div
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                  }}
                >
                  <Checkbox
                    checked={useCSRQuery}
                    onCheckedChange={checked => {
                      const next = Boolean(checked);
                      setUseCSRQuery(next);
                      hardLoadConsumer(currentConsumerPath, next);
                    }}
                  />
                  CSR only (?csr=1)
                </label>
                <a
                  href={buildConsumerUrl(currentConsumerPath)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    color: '#0369a1',
                    fontWeight: 600,
                  }}
                >
                  Open in new tab ↗
                </a>
              </div>
            </div>

            <div className="apps-viewport-bar">
              <input
                className="apps-url-input"
                aria-label="Consumer URL path"
                data-testid="consumer-url-input"
                value={addressPath}
                onChange={e => setAddressPath(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') hardLoadConsumer(addressPath);
                }}
              />
              <Button
                className="lab-primary"
                data-testid="consumer-ssr-go"
                onClick={() => hardLoadConsumer(addressPath)}
              >
                SSR Reload
              </Button>
              <Button
                data-testid="consumer-csr-go"
                onClick={() => csrNavigateConsumer(addressPath)}
              >
                CSR Navigate
              </Button>
              <Button
                data-testid="consumer-rediscover-btn"
                onClick={triggerRediscover}
              >
                Re-discover
              </Button>
            </div>

            <div className="apps-quick-nav">
              <Button
                data-testid="nav-home"
                onClick={() => csrNavigateConsumer('/')}
              >
                Home (/)
              </Button>
              <Button
                data-testid="nav-producer-b"
                onClick={() => csrNavigateConsumer(`/${productRoutePrefix}`)}
              >
                B · /{productRoutePrefix}
              </Button>
              <Button
                data-testid="nav-producer-a"
                onClick={() =>
                  csrNavigateConsumer(`/${weatherRoutePrefix}/overview`)
                }
              >
                A · /{weatherRoutePrefix}/overview
              </Button>
              <Button
                data-testid="nav-nested-c"
                onClick={() =>
                  csrNavigateConsumer(
                    `/${weatherRoutePrefix}/${childRoutePrefix}`,
                  )
                }
              >
                A→C · /{weatherRoutePrefix}/{childRoutePrefix}
              </Button>
              <Button
                data-testid="nav-nested-leaf"
                onClick={() =>
                  csrNavigateConsumer(
                    `/${weatherRoutePrefix}/${childRoutePrefix}/gusts`,
                  )
                }
              >
                Leaf · /{weatherRoutePrefix}/{childRoutePrefix}/gusts
              </Button>
            </div>

            <iframe
              key={iframeKey}
              ref={iframeRef}
              title="Dynamic consumer preview"
              data-testid="dynamic-consumer-iframe"
              className="apps-iframe"
              src={iframeSrc}
            />
          </section>

          {/* Real-time Inspector */}
          <section className="apps-card" aria-label="Discovery inspector">
            <div className="apps-card-header">
              <h2>Live Discovery &amp; Delivery Inspector</h2>
              <Button
                data-testid="clear-discovery-logs"
                onClick={() => void clearLogs()}
              >
                Clear Logs
              </Button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '10px',
              }}
            >
              <span className="apps-meta-pill" data-testid="http-log-count">
                HTTP fetches: {httpLogs.length}
              </span>
              <span className="apps-meta-pill" data-testid="hook-trace-count">
                load(ctx) calls: {telemetry?.traces.length ?? 0}
              </span>
              <span className="apps-meta-pill ok">
                MF remotes: {telemetry?.registeredRemotes.length ?? 0}
              </span>
              {telemetry && (
                <span className="apps-meta-pill">
                  {telemetry.hydratedFromSSR ? 'Hydrated from SSR' : 'CSR Boot'}
                </span>
              )}
            </div>

            <div className="apps-inspector-tabs">
              <button
                type="button"
                className={`apps-inspector-tab ${inspectorTab === 'http' ? 'active' : ''}`}
                onClick={() => setInspectorTab('http')}
              >
                Platform HTTP Logs ({httpLogs.length})
              </button>
              <button
                type="button"
                className={`apps-inspector-tab ${inspectorTab === 'runtime' ? 'active' : ''}`}
                onClick={() => setInspectorTab('runtime')}
              >
                Consumer load(ctx) &amp; MF ({telemetry?.traces.length ?? 0})
              </button>
            </div>

            {inspectorTab === 'http' ? (
              <div className="apps-log-list" data-testid="http-log-list">
                {httpLogs.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    No discovery HTTP requests recorded yet.
                  </p>
                ) : (
                  httpLogs.map(log => (
                    <div
                      key={log.id}
                      className={`apps-log-item ${log.status === 409 ? 'expired' : ''}`}
                    >
                      <div className="apps-log-head">
                        <strong>
                          [{log.env}] source={log.source} · {log.pathname}
                        </strong>
                        <span
                          className={`apps-meta-pill ${log.status === 200 ? 'ok' : 'err'}`}
                        >
                          HTTP {log.status}
                          {log.deliveryMode ? ` · ${log.deliveryMode}` : ''}
                          {log.pathClipped ? ' · clipped' : ''}
                        </span>
                      </div>
                      <div className="apps-log-detail">
                        {log.sid && <div>sid: {log.sid}</div>}
                        {log.error && <div>error: {log.error}</div>}
                        {log.returnedRoutes && (
                          <div>
                            routes:{' '}
                            {log.returnedRoutes.length
                              ? log.returnedRoutes
                                  .map(
                                    r =>
                                      `${r.route}→${r.moduleName}(${r.expose}, children=${r.discoverChildren})`,
                                  )
                                  .join(', ')
                              : '(empty)'}
                          </div>
                        )}
                        <div>
                          bundledChildren:{' '}
                          {log.bundledChildren?.length
                            ? log.bundledChildren
                                .map(
                                  c => `${c.consumer}[${c.routes.join(', ')}]`,
                                )
                                .join('; ')
                            : 'none (layered — NOT sent)'}
                        </div>
                        {log.fixedChildren && log.fixedChildren.length > 0 && (
                          <div>
                            fixedChildren:{' '}
                            {log.fixedChildren
                              .map(c => `${c.consumer}@${c.sid}`)
                              .join(', ')}
                          </div>
                        )}
                        {log.moduleInfoKeys && (
                          <div>
                            moduleInfo keys: [{log.moduleInfoKeys.join(', ')}]
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="apps-log-list" data-testid="runtime-trace-list">
                {telemetry && (
                  <div className="apps-log-item">
                    <div className="apps-log-head">
                      <strong>Consumer MF Runtime State</strong>
                    </div>
                    <div className="apps-log-detail">
                      <div>
                        registered remotes:{' '}
                        {telemetry.registeredRemotes.length
                          ? telemetry.registeredRemotes
                              .map(r => `${r.name}(${r.entry || r.version})`)
                              .join(', ')
                          : '(none)'}
                      </div>
                      <div>
                        accepted sids: {JSON.stringify(telemetry.acceptedSids)}
                      </div>
                      <div>
                        globalSnapshot keys: [
                        {telemetry.globalSnapshotKeys.join(', ')}]
                      </div>
                    </div>
                  </div>
                )}
                {(telemetry?.traces || []).map(trace => (
                  <div
                    key={trace.id}
                    className={`apps-log-item ${trace.error ? 'expired' : ''}`}
                  >
                    <div className="apps-log-head">
                      <strong>
                        [{trace.env}] {trace.consumer} · base={trace.basename}
                      </strong>
                      <span
                        className={`apps-meta-pill ${trace.fetchKind === 'http' ? 'layered' : 'full'}`}
                      >
                        {trace.fetchKind} · {trace.durationMs}ms
                      </span>
                    </div>
                    <div className="apps-log-detail">
                      <div>
                        pathname: {trace.pathname} · mountId: {trace.mountId}
                      </div>
                      <div>
                        source: {trace.source} ({trace.deliveryMode}
                        {trace.pathClipped ? '+clipped' : ''})
                        {trace.sid ? ` · sid=${trace.sid}` : ''}
                      </div>
                      <div>routes: [{trace.routes.join(', ')}]</div>
                      {trace.error && <div>error: {trace.error}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </LabLayout>
  );
}
