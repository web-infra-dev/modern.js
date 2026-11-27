import { useSearchParams } from '@modern-js/runtime/router';
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

const EXPIRED_POLICY_STORAGE_KEY = 'mf-lab-shell-expired-policy';

function deploymentApiBase(): string {
  return process.env.MF_LAB_API || '';
}

function defaultConsumerOrigin(): string {
  return process.env.MF_LAB_CONSUMER || 'http://localhost:4308';
}

function readStoredExpiredPolicy(): 'reload' | 'defer' {
  if (typeof window === 'undefined') return 'reload';
  try {
    return window.sessionStorage.getItem(EXPIRED_POLICY_STORAGE_KEY) === 'defer'
      ? 'defer'
      : 'reload';
  } catch {
    return 'reload';
  }
}

export function ApplicationsWorkbench() {
  const [params] = useSearchParams();
  const activeTab = params.get('tab') === 'platform' ? 'platform' : 'preview';

  const [platformState, setPlatformState] = useState<PlatformStateResponse>();
  const [portalDraft, setPortalDraft] = useState<PortalPlatformConfig>();
  const [childDraft, setChildDraft] = useState<ChildPlatformConfig>();
  const [expiredPolicy, setExpiredPolicy] = useState<'reload' | 'defer'>(
    readStoredExpiredPolicy,
  );
  const [useCSRQuery, setUseCSRQuery] = useState(false);
  const [addressPath, setAddressPath] = useState('/products');
  const [iframeSrc, setIframeSrc] = useState(
    () => `${defaultConsumerOrigin()}/products`,
  );
  const [iframeKey, setIframeKey] = useState(0);
  const [activeStep, setActiveStep] = useState<number>(1);
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
    const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const nextUrl = buildConsumerUrl(clean, csr);
    setAddressPath(clean);
    setCurrentConsumerPath(clean);
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

  const applyExpiredPolicy = (policy: 'reload' | 'defer') => {
    setExpiredPolicy(policy);
    try {
      window.sessionStorage.setItem(EXPIRED_POLICY_STORAGE_KEY, policy);
    } catch {
      // ignore storage errors
    }
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'mf-lab-apps-set-expired-policy', policy },
      '*',
    );
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
          ? `已发布根配置（${newSid}，模式：${data.sources.portal.active?.deliveryMode === 'full' ? '全量下发' : '分层下发'}${data.sources.portal.active?.pathClipped ? ' + 按路径裁剪' : ''}）。切回「渲染与分层验证」Tab 即可查看效果。`
          : `已独立发布 A 的子层配置（${newSid}），根 portal sid 保持不变。`,
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
        '已恢复默认配置：全量下发（Full）+ 生产者 A（嵌套 C）+ 生产者 B。',
      );
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
  const isFullMode = portalActive?.deliveryMode !== 'layered';

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

  const runGuidedStep = async (step: number) => {
    setActiveStep(step);
    if (step === 1) {
      await clearLogs();
      hardLoadConsumer(`/${productPrefix}`);
    } else if (step === 2) {
      csrNavigateConsumer(`/${weatherPrefix}/overview`);
    } else if (step === 3) {
      csrNavigateConsumer(`/${weatherPrefix}/${childPrefix}/gusts`);
    } else if (step === 4) {
      hardLoadConsumer(`/${productPrefix}`);
    }
  };

  return (
    <LabLayout
      section="apps"
      title="App discovery"
      description="Dynamic micro-frontend discovery: configure delivery mode in Deployment platform, then verify Full vs Layered loading and nested routing in Render & discovery."
      tabs={[
        {
          label: '渲染与分层验证',
          href: '/?lab=apps&tab=preview',
          active: activeTab === 'preview',
        },
        {
          label: '部署平台配置',
          href: '/?lab=apps&tab=platform',
          active: activeTab === 'platform',
        },
      ]}
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

        {activeTab === 'preview' ? (
          <>
            {/* Guided walkthrough bar */}
            <section
              className="apps-card apps-guide-bar"
              aria-label="Layered loading guide"
            >
              <div className="apps-guide-head">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <h2>分层加载验证指引</h2>
                  {portalActive && (
                    <span
                      className={`apps-meta-pill ${portalActive.deliveryMode}`}
                      data-testid="active-delivery-mode"
                    >
                      当前平台模式：
                      {isFullMode ? '全量下发 (Full)' : '分层下发 (Layered)'}
                      {portalActive.pathClipped ? ' + 按路径裁剪' : ''}
                    </span>
                  )}
                  {portalActive && (
                    <span
                      className="apps-meta-pill"
                      data-testid="active-portal-sid"
                    >
                      {portalActive.sid}
                    </span>
                  )}
                </div>
                <a
                  href="/?lab=apps&tab=platform"
                  className="apps-link-btn"
                  data-testid="goto-platform-tab"
                >
                  去「部署平台配置」切换全量 / 分层或删改配置 →
                </a>
              </div>

              <div className="apps-guide-steps">
                <button
                  type="button"
                  data-testid="guide-step-1"
                  className={`apps-step-btn ${activeStep === 1 ? 'active' : ''}`}
                  onClick={() => void runGuidedStep(1)}
                >
                  <span className="apps-step-title">
                    ① 首屏访问 B（/{productPrefix}）
                  </span>
                  <span className="apps-step-desc">
                    清空日志并 SSR 直达 B。
                    {isFullMode
                      ? '全量模式：1 次请求带回 A/B 及嵌套 C。'
                      : '分层模式：1 次请求仅下发根层，不含 C。'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="guide-step-2"
                  className={`apps-step-btn ${activeStep === 2 ? 'active' : ''}`}
                  onClick={() => void runGuidedStep(2)}
                >
                  <span className="apps-step-title">
                    ② 切页访问 A（/{weatherPrefix}/overview）
                  </span>
                  <span className="apps-step-desc">
                    CSR 跳转到带嵌套能力的 A。
                    {isFullMode
                      ? '全量模式：0 新增 HTTP 请求。'
                      : '分层模式：触发第 2 次 HTTP 拉取 A 子层。'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="guide-step-3"
                  className={`apps-step-btn ${activeStep === 3 ? 'active' : ''}`}
                  onClick={() => void runGuidedStep(3)}
                >
                  <span className="apps-step-title">
                    ③ 进入嵌套 A→C（/{weatherPrefix}/{childPrefix}/gusts）
                  </span>
                  <span className="apps-step-desc">
                    验证三层嵌套渲染与叶子本地路由 `/gusts`（不再发第 3
                    层探测）。
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="guide-step-4"
                  className={`apps-step-btn ${activeStep === 4 ? 'active' : ''}`}
                  onClick={() => void runGuidedStep(4)}
                >
                  <span className="apps-step-title">
                    ④ 改配 / 删配验证（SSR 重载 /{productPrefix}）
                  </span>
                  <span className="apps-step-desc">
                    在「部署平台配置」删掉 B 后点此步，验证直接命中 404 路由。
                  </span>
                </button>
              </div>
            </section>

            {/* Main split: Consumer Preview + Live Inspector */}
            <div className="apps-runtime-split">
              <section
                className="apps-card"
                aria-label="Dynamic consumer preview"
              >
                <div className="apps-card-header">
                  <h2>动态消费者视口</h2>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
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
                      纯 CSR (?csr=1)
                    </label>
                    <a
                      href={buildConsumerUrl(currentConsumerPath)}
                      target="_blank"
                      rel="noreferrer"
                      className="apps-link-btn"
                    >
                      新窗口打开 ↗
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
                    SSR 刷新
                  </Button>
                  <Button
                    data-testid="consumer-csr-go"
                    onClick={() => csrNavigateConsumer(addressPath)}
                  >
                    CSR 跳转
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

              <section className="apps-card" aria-label="Discovery inspector">
                <div className="apps-card-header">
                  <h2>下发与加载观测</h2>
                  <Button
                    data-testid="clear-discovery-logs"
                    onClick={() => void clearLogs()}
                  >
                    清空日志
                  </Button>
                </div>

                <div className="apps-kpi-row">
                  <div className="apps-kpi">
                    <div className="apps-kpi-label">平台 HTTP 请求</div>
                    <div
                      className="apps-kpi-value"
                      data-testid="http-log-count"
                    >
                      {httpLogs.length}
                    </div>
                  </div>
                  <div className="apps-kpi">
                    <div className="apps-kpi-label">load(ctx) 调用</div>
                    <div
                      className="apps-kpi-value"
                      data-testid="hook-trace-count"
                    >
                      {telemetry?.traces.length ?? 0}
                    </div>
                  </div>
                  <div className="apps-kpi">
                    <div className="apps-kpi-label">已注册 Remotes</div>
                    <div className="apps-kpi-value">
                      {telemetry?.registeredRemotes.length ?? 0}
                    </div>
                  </div>
                </div>

                <div className="apps-inspector-tabs">
                  <button
                    type="button"
                    className={`apps-inspector-tab ${inspectorTab === 'http' ? 'active' : ''}`}
                    onClick={() => setInspectorTab('http')}
                  >
                    平台下发日志 ({httpLogs.length})
                  </button>
                  <button
                    type="button"
                    className={`apps-inspector-tab ${inspectorTab === 'runtime' ? 'active' : ''}`}
                    onClick={() => setInspectorTab('runtime')}
                  >
                    运行时 &amp; MF 状态
                  </button>
                </div>

                {inspectorTab === 'http' ? (
                  <div className="apps-log-list" data-testid="http-log-list">
                    {httpLogs.length === 0 ? (
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          margin: 0,
                        }}
                      >
                        点击上方步骤 ① 开始记录下发请求。
                      </p>
                    ) : (
                      httpLogs.map(log => (
                        <div
                          key={log.id}
                          className={`apps-log-item ${log.status === 409 ? 'expired' : ''}`}
                        >
                          <div className="apps-log-head">
                            <strong>
                              [{log.env}] {log.source} · {log.pathname}
                            </strong>
                            <span
                              className={`apps-meta-pill ${log.status === 200 ? 'ok' : 'err'}`}
                            >
                              {log.status}
                              {log.deliveryMode ? ` · ${log.deliveryMode}` : ''}
                            </span>
                          </div>
                          <div className="apps-log-detail">
                            {log.returnedRoutes && (
                              <div>
                                下发路由：
                                {log.returnedRoutes.length
                                  ? log.returnedRoutes
                                      .map(
                                        r =>
                                          `${r.route}→${r.moduleName}${r.discoverChildren ? '(含子层)' : ''}`,
                                      )
                                      .join(', ')
                                  : '(空)'}
                              </div>
                            )}
                            <div>
                              附带嵌套子层：
                              {log.bundledChildren?.length
                                ? `已全量附带 [${log.bundledChildren.map(c => c.routes.join(', ')).join('; ')}]`
                                : '未附带（分层按需）'}
                            </div>
                            {log.error && <div>error: {log.error}</div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div
                    className="apps-log-list"
                    data-testid="runtime-trace-list"
                  >
                    {telemetry && (
                      <div className="apps-log-item">
                        <div className="apps-log-head">
                          <strong>Consumer MF 实例</strong>
                          <span className="apps-meta-pill ok">
                            {telemetry.hydratedFromSSR ? 'SSR Hydrated' : 'CSR'}
                          </span>
                        </div>
                        <div className="apps-log-detail">
                          <div>
                            remotes:{' '}
                            {telemetry.registeredRemotes.length
                              ? telemetry.registeredRemotes
                                  .map(r => r.name)
                                  .join(', ')
                              : '(无)'}
                          </div>
                          <div>
                            sids: {JSON.stringify(telemetry.acceptedSids)}
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
                            [{trace.env}] {trace.consumer}
                          </strong>
                          <span
                            className={`apps-meta-pill ${trace.fetchKind === 'http' ? 'layered' : 'full'}`}
                          >
                            {trace.fetchKind} · {trace.durationMs}ms
                          </span>
                        </div>
                        <div className="apps-log-detail">
                          <div>
                            path: {trace.pathname} · base: {trace.basename}
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
          </>
        ) : (
          /* Tab 2: Deployment Platform Configuration */
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
                <h2>部署平台配置（模拟 Goofy / SDK Store）</h2>
                {portalActive && (
                  <span
                    className={`apps-meta-pill ${portalActive.deliveryMode}`}
                    data-testid="active-delivery-mode"
                  >
                    已生效：
                    {isFullMode ? '全量下发 (Full)' : '分层下发 (Layered)'}
                    {portalActive.pathClipped ? ' + 按路径裁剪' : ''}
                  </span>
                )}
                {portalActive && (
                  <span
                    className="apps-meta-pill"
                    data-testid="active-portal-sid"
                  >
                    portal: {portalActive.sid}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <Button
                  className="lab-primary"
                  disabled={busy || !portalDraft}
                  data-testid="publish-portal"
                  onClick={() =>
                    portalDraft && void publishSource('portal', portalDraft)
                  }
                >
                  发布根配置
                </Button>
                <Button
                  disabled={busy}
                  data-testid="reset-platform"
                  onClick={() => void resetPlatform()}
                >
                  恢复默认
                </Button>
                <a
                  href="/?lab=apps&tab=preview"
                  className="apps-link-btn"
                  data-testid="goto-preview-tab"
                >
                  去「渲染与分层验证」看效果 →
                </a>
              </div>
            </div>

            {portalDraft && (
              <div
                style={{
                  display: 'flex',
                  gap: '18px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--lab-line, #dfe5ec)',
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
                  下发模式
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
                      Full · 全量下发（一次带回根层与子层）
                    </SelectItem>
                    <SelectItem value="layered">
                      Layered · 分层下发（进入子应用再按层请求）
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
                        prev
                          ? { ...prev, pathClipped: Boolean(checked) }
                          : prev,
                      )
                    }
                  />
                  同层按访问路径裁剪（Path-clipped）
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
                  快照过期 (409) 策略
                  <Select
                    aria-label="Expired policy"
                    data-testid="expired-policy-select"
                    value={expiredPolicy}
                    onValueChange={value =>
                      applyExpiredPolicy(value as 'reload' | 'defer')
                    }
                  >
                    <SelectItem value="reload">
                      自动刷新页面 (reload)
                    </SelectItem>
                    <SelectItem value="defer">保留当前页面 (defer)</SelectItem>
                  </Select>
                </label>
              </div>
            )}

            <div className="apps-platform-grid">
              {/* Root Consumer Portal Config */}
              <div>
                <div className="apps-card-header">
                  <h3>根消费者挂载（portal → 生产者 A / B）</h3>
                  <span className="apps-meta-pill">
                    已启用{' '}
                    {portalDraft?.applications.filter(a => a.enabled).length ??
                      0}{' '}
                    项
                  </span>
                </div>

                {portalDraft?.applications.map(app => (
                  <div
                    key={app.id}
                    data-testid={`portal-app-${app.id}`}
                    className={`apps-app-row ${app.enabled ? '' : 'disabled'}`}
                  >
                    <div className="apps-app-row-top">
                      <strong style={{ fontSize: '13px' }}>{app.title}</strong>
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
                          {app.enabled ? '已启用' : '已删除（访问将命中 404）'}
                        </span>
                        <Button
                          data-testid={`toggle-portal-app-${app.id}`}
                          onClick={() =>
                            updatePortalApp(app.id, { enabled: !app.enabled })
                          }
                        >
                          {app.enabled ? '删除配置' : '恢复启用'}
                        </Button>
                      </div>
                    </div>
                    <div className="apps-app-fields">
                      <label className="apps-field">
                        挂载路由
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
                                ./Weather (普通组件)
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
                          生产者版本
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
                          嵌套子层方式
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
                              独立动态子来源 (weather-children)
                            </option>
                            <option value="fixed">
                              锁定固定子快照 (deploymentId)
                            </option>
                            <option value="none">关闭子层 (叶子)</option>
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
                  <h3>生产者 A 嵌套子部署（weather-children）</h3>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                    }}
                  >
                    {childActive && (
                      <span
                        className="apps-meta-pill"
                        data-testid="active-child-sid"
                      >
                        {childActive.sid}
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
                      独立发布子层
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
                      <strong style={{ fontSize: '13px' }}>{app.title}</strong>
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
                          {app.enabled ? '已启用' : '已删除（404）'}
                        </span>
                        <Button
                          data-testid={`toggle-child-app-${app.id}`}
                          onClick={() =>
                            updateChildApp(app.id, { enabled: !app.enabled })
                          }
                        >
                          {app.enabled ? '删除配置' : '恢复启用'}
                        </Button>
                      </div>
                    </div>
                    <div className="apps-app-fields">
                      <label className="apps-field">
                        嵌套路由（相对 A）
                        <input
                          data-testid={`child-route-input-${app.id}`}
                          value={app.route}
                          onChange={e =>
                            updateChildApp(app.id, { route: e.target.value })
                          }
                        />
                      </label>
                      <label className="apps-field">
                        下发 station prop
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
                    margin: '8px 0 0',
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  提示：独立发布 <code>weather-children</code> 只更新子层{' '}
                  <code>sid</code>，根 <code>portal</code> 快照不受影响。
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </LabLayout>
  );
}
