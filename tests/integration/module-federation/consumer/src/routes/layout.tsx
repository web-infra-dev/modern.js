import { useApplications } from '@modern-js/runtime/mf';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from '@modern-js/runtime/router';
import { useEffect, useState } from 'react';
import {
  clearClientTraces,
  emitTelemetry,
  getClientTelemetry,
  markForceNetworkReload,
  setExpiredPolicy,
  subscribeTelemetry,
  type ClientRuntimeTelemetry,
} from '../applications';

export default function ConsumerLayout() {
  const apps = useApplications();
  const location = useLocation();
  const navigate = useNavigate();
  const [telemetry, setTelemetry] = useState<ClientRuntimeTelemetry>({
    hydratedFromSSR: false,
    acceptedSids: {},
    registeredRemotes: [],
    globalSnapshotKeys: [],
    traces: [],
  });
  const [mounted, setMounted] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setEmbedded(window.self !== window.top);
    } catch {
      setEmbedded(true);
    }
    const sync = () => setTelemetry(getClientTelemetry());
    sync();
    const unsub = subscribeTelemetry(sync);
    emitTelemetry();
    return unsub;
  }, [location.pathname, location.search]);

  const rediscover = async (targetPath?: string) => {
    setBusy(true);
    setStatusMessage('');
    try {
      markForceNetworkReload();
      const result = await apps.discoverApplications({
        pathname: targetPath || location.pathname,
        cache: 'reload',
      });
      setStatusMessage(
        `Re-discovered ${result.target} (${result.contexts.length} layer(s))`,
      );
      emitTelemetry();
    } catch (error) {
      setStatusMessage(
        `Discovery notice: ${error instanceof Error ? error.message : String(error)}`,
      );
      emitTelemetry();
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'mf-lab-apps-navigate' && typeof data.to === 'string') {
        navigate(data.to);
      } else if (
        data.type === 'mf-lab-apps-set-expired-policy' &&
        (data.policy === 'reload' || data.policy === 'defer')
      ) {
        setExpiredPolicy(data.policy);
      } else if (data.type === 'mf-lab-apps-rediscover') {
        void rediscover(
          typeof data.pathname === 'string' ? data.pathname : undefined,
        );
      } else if (data.type === 'mf-lab-apps-clear-traces') {
        clearClientTraces();
      } else if (data.type === 'mf-lab-apps-ping') {
        emitTelemetry();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate, location.pathname]);

  const navLinkStyle = (active: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    textDecoration: 'none',
    color: active ? '#fff' : '#1e293b',
    background: active ? '#0f172a' : 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(15,23,42,0.12)',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#18181b',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
      }}
    >
      {!embedded && (
        <header
          data-testid="consumer-header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '10px 16px',
            background: 'rgba(250, 250, 250, 0.86)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(9, 9, 11, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <strong style={{ fontSize: '13px' }}>Dynamic Consumer</strong>
            <code
              data-testid="consumer-pathname"
              style={{
                fontSize: '12px',
                padding: '2px 7px',
                borderRadius: '6px',
                background: '#e2e8f0',
              }}
            >
              {location.pathname}
            </code>
            <span
              data-testid="consumer-hydration-badge"
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '999px',
                background:
                  mounted && telemetry.hydratedFromSSR ? '#dcfce7' : '#e0f2fe',
                color:
                  mounted && telemetry.hydratedFromSSR ? '#166534' : '#075985',
                fontWeight: 600,
              }}
            >
              {mounted
                ? telemetry.hydratedFromSSR
                  ? 'SSR Hydrated'
                  : 'CSR'
                : 'Loading'}
            </span>
            <span
              data-testid="consumer-remotes-count"
              style={{ fontSize: '11px', color: '#475569' }}
            >
              MF remotes: {telemetry.registeredRemotes.length}
            </span>
          </div>

          <nav
            aria-label="Consumer routes"
            style={{
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Link to="/" style={navLinkStyle(location.pathname === '/')}>
              Home
            </Link>
            <Link
              to="/products"
              style={navLinkStyle(location.pathname.startsWith('/products'))}
            >
              Producer B (/products)
            </Link>
            <Link
              to="/weather/overview"
              style={navLinkStyle(
                location.pathname.startsWith('/weather') &&
                  !location.pathname.includes('/wind'),
              )}
            >
              Producer A (/weather/overview)
            </Link>
            <Link
              to="/weather/wind"
              style={navLinkStyle(location.pathname === '/weather/wind')}
            >
              Nested A→C (/weather/wind)
            </Link>
            <Link
              to="/weather/wind/gusts"
              style={navLinkStyle(location.pathname === '/weather/wind/gusts')}
            >
              Leaf (/weather/wind/gusts)
            </Link>
            <button
              type="button"
              disabled={busy}
              data-testid="consumer-rediscover"
              onClick={() => void rediscover()}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#fff',
                color: '#0369a1',
                border: '1px solid #7dd3fc',
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {busy ? 'Checking…' : 'Re-discover'}
            </button>
          </nav>
        </header>
      )}

      {telemetry.expiredEvent && (
        <div
          role="alert"
          data-testid="consumer-expired-banner"
          style={{
            margin: '10px 16px 0',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#92400e',
            fontSize: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>
            <strong>Snapshot expired (409)</strong> [
            {telemetry.expiredEvent.action}]: {telemetry.expiredEvent.message}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #d97706',
              background: '#fff',
              color: '#92400e',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      )}

      {statusMessage && (
        <div
          style={{
            margin: '10px 16px 0',
            padding: '8px 12px',
            borderRadius: '8px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            fontSize: '12px',
            color: '#334155',
          }}
        >
          {statusMessage}
        </div>
      )}

      <main style={{ padding: '16px' }}>
        <Outlet />
      </main>
    </div>
  );
}
