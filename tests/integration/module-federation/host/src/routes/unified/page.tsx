import { useState } from 'react';
import { createReactRemote, ReactRemote } from '@modern-js/runtime/mf';

const Signal = createReactRemote({ remote: 'provider/Signal' });
const Forecast = createReactRemote({ remote: 'provider/Forecast' });
const Bridge = createReactRemote<{ label: string }>({
  remote: 'provider/BridgeCard',
  loading: (
    <p data-testid="unified-bridge-loading">Loading client application</p>
  ),
});

export default function Page() {
  const [label, setLabel] = useState('First application');
  const [mounted, setMounted] = useState(true);
  return (
    <main>
      <Signal />
      <Forecast />
      <button
        data-testid="unified-update"
        onClick={() => setLabel('Updated application')}
      >
        Update props
      </button>
      <button
        data-testid="unified-toggle"
        onClick={() => setMounted(value => !value)}
      >
        Toggle application
      </button>
      {mounted && <Bridge label={label} />}
      <ReactRemote
        remote="provider/BridgeCard"
        props={{ label: 'Second application' }}
      />
    </main>
  );
}
