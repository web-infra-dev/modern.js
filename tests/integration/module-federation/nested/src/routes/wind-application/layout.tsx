import { Link, Outlet, useOutletContext } from '@modern-js/runtime/router';
import { useState } from 'react';

export default function WindApplicationLayout() {
  const { station = 'West Lake Ridge' } =
    useOutletContext<{ station?: string } | undefined>() || {};
  const [unit, setUnit] = useState<'km/h' | 'm/s'>('km/h');

  return (
    <section
      data-testid="nested-wind-app"
      style={{
        marginTop: '14px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(2, 132, 199, 0.28)',
        background: 'rgba(240, 249, 255, 0.92)',
        color: '#0f172a',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '10px',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#0284c7',
              color: '#fff',
              marginRight: '8px',
            }}
          >
            Layer 2 · Nested Bridge App (lab_nested/WindApplication)
          </span>
          <strong data-testid="nested-wind-station">{station}</strong>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link
            to="."
            data-testid="nested-wind-overview-link"
            style={{ fontSize: '13px', color: '#0369a1' }}
          >
            Wind overview
          </Link>
          <Link
            to="gusts"
            data-testid="nested-wind-gusts-link"
            style={{ fontSize: '13px', color: '#0369a1' }}
          >
            Gust details (/gusts)
          </Link>
          <button
            type="button"
            data-testid="nested-wind-unit-toggle"
            onClick={() => setUnit(prev => (prev === 'km/h' ? 'm/s' : 'km/h'))}
            style={{
              fontSize: '12px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #bae6fd',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Unit: {unit}
          </button>
        </div>
      </div>
      <Outlet context={{ station, unit }} />
    </section>
  );
}
