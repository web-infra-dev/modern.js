import { useOutletContext } from '@modern-js/runtime/router';
import WeatherWind from '../../WeatherWind';

export default function WindOverviewPage() {
  const { station = 'West Lake Ridge', unit = 'km/h' } = useOutletContext<{
    station?: string;
    unit?: 'km/h' | 'm/s';
  }>();
  const speed = unit === 'km/h' ? '14 km/h' : '3.9 m/s';

  return (
    <div data-testid="nested-wind-overview">
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#334155' }}>
        Dynamically mounted child application inside Producer A. Station{' '}
        <strong>{station}</strong> current wind: <strong>{speed}</strong> (NNW).
      </p>
      <div
        style={{
          padding: '8px 10px',
          borderRadius: '8px',
          background: '#fff',
          border: '1px solid #e0f2fe',
        }}
      >
        <WeatherWind />
      </div>
    </div>
  );
}
