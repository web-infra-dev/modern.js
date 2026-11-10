import { useState } from 'react';
import { createReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';

const Remote = createReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/FailedSSRApp'),
  memoryRoute: { entryPath: '/' },
  loading: <p data-testid="bridge-failed-loading">Loading station</p>,
});

export default function BridgeFailure() {
  const [label, setLabel] = useState('Recovered Bridge station');
  return (
    <main>
      <h1>Bridge SSR failure recovery</h1>
      <button
        data-testid="bridge-recovery-rename"
        onClick={() => setLabel('Updated recovered station')}
      >
        Rename
      </button>
      <section data-testid="bridge-recovered-app">
        <Remote label={label} />
      </section>
    </main>
  );
}
