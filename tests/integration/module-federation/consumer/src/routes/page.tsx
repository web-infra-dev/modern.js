import { Link } from '@modern-js/runtime/router';
import { useEffect, useState } from 'react';
import {
  getClientTelemetry,
  subscribeTelemetry,
  type ClientRuntimeTelemetry,
} from '../applications';

export default function ConsumerHomePage() {
  const [telemetry, setTelemetry] = useState<ClientRuntimeTelemetry>({
    hydratedFromSSR: false,
    acceptedSids: {},
    registeredRemotes: [],
    globalSnapshotKeys: [],
    globalModuleInfo: [],
    bundledChildren: [],
    traces: [],
  });

  useEffect(() => {
    setTelemetry(getClientTelemetry());
    return subscribeTelemetry(() => setTelemetry(getClientTelemetry()));
  }, []);

  const latestRootTrace = telemetry.traces.find(t => t.source === 'portal');
  const routeEntries = latestRootTrace?.routes || [];

  return (
    <section
      data-testid="consumer-home"
      style={{
        padding: '18px 20px',
        borderRadius: '14px',
        background: '#fff',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>
        Dynamic Consumer Home (0 static remotes)
      </h2>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#475569' }}>
        This Modern.js host has no <code>module-federation.config.ts</code> and
        no static <code>remotes</code>. All remote routes, MF snapshots (
        <code>moduleInfo</code>), and nested child mounts are discovered
        dynamically from <code>src/applications.ts</code>.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
        }}
      >
        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}
          >
            Discovered Root Routes
          </div>
          {routeEntries.length ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
              {routeEntries.map(entry => {
                const prefix = entry
                  .split(' -> ')[0]
                  .replace(/\/?\*$/, '')
                  .replace(/^\/+/, '');
                return (
                  <li key={entry} style={{ marginBottom: '4px' }}>
                    <Link to={`/${prefix}`}>{entry}</Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              No root dynamic routes matched this path yet (in Path-clipped
              mode, navigate directly to <code>/products</code> or{' '}
              <code>/weather/overview</code>).
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}
          >
            Registered MF Remotes ({telemetry.registeredRemotes.length})
          </div>
          {telemetry.registeredRemotes.length ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px' }}>
              {telemetry.registeredRemotes.map(r => (
                <li key={r.name}>
                  <code>{r.name}</code>{' '}
                  <span style={{ color: '#64748b' }}>
                    ({r.entry || r.version})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              None registered yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
