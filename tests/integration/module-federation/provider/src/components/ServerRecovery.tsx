import { useEffect } from 'react';
import { reportRecovery } from '../../../host/src/failure/events';
import { withRenderFailure } from '../render-failure';
function Recovery({ mfData }: { mfData?: { source: string } }) {
  useEffect(() => {
    if (mfData)
      reportRecovery(
        'Host retry fallback',
        'provider/ServerRecovery',
        'MF data downgrade',
      );
  }, [mfData]);
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

export default withRenderFailure(Recovery);
