export default function Recovery({ mfData }: { mfData?: { source: string } }) {
  return (
    <article className="recovery" data-testid="server-recovery">
      <small>Weather data recovery</small>
      <h2>Hangzhou</h2>
      <div className="recovery-temperature">{mfData ? '30°' : '—°'}</div>
      <p>
        {mfData
          ? 'Partly cloudy · Forecast restored'
          : 'Restoring weather data…'}
      </p>
      <p data-testid="data-source">{mfData?.source || 'Recovering data…'}</p>
    </article>
  );
}
