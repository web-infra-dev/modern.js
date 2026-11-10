import { useState } from 'react';
import { createReactRemote, ReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
const loadStation = () => loadRemote('provider/BridgeCard');
const Station = createReactRemote<{ label: string }>({
  remote: loadStation,
  loading: (
    <p data-testid="station-loading">
      Connecting to independent weather station…
    </p>
  ),
});
export default function BridgeStations() {
  const [label, setLabel] = useState('Riverside station');
  const [mounted, setMounted] = useState(true);
  return (
    <>
      <div className="controls">
        <button
          data-testid="station-update"
          onClick={() => setLabel('Lakeside station')}
        >
          Rename first station
        </button>
        <button
          data-testid="station-toggle"
          onClick={() => setMounted(value => !value)}
        >
          {mounted ? 'Disconnect' : 'Reconnect'} first station
        </button>
      </div>
      {mounted && <Station label={label} />}
      <ReactRemote remote={loadStation} props={{ label: 'Hilltop station' }} />
    </>
  );
}
