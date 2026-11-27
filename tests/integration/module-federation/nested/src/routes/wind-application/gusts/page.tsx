import { useOutletContext } from '@modern-js/runtime/router';

export default function WindGustsPage() {
  const { station = 'West Lake Ridge', unit = 'km/h' } = useOutletContext<{
    station?: string;
    unit?: 'km/h' | 'm/s';
  }>();
  const peak = unit === 'km/h' ? '26 km/h' : '7.2 m/s';

  return (
    <div data-testid="nested-wind-gusts">
      <h4 style={{ margin: '0 0 6px', fontSize: '14px' }}>
        Local Leaf Route: /gusts ({station})
      </h4>
      <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>
        Peak gust: <strong>{peak}</strong>. Because{' '}
        <code>discoverChildren: false</code> stops recursive discovery at{' '}
        <code>lab_nested/WindApplication</code>, this leaf route is matched
        directly by the nested app&apos;s own local Router with 0 extra
        discovery calls.
      </p>
    </div>
  );
}
