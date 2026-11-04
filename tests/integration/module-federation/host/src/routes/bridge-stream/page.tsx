import { useState } from 'react';
import { ReactRemote } from '@modern-js/runtime/mf';
import { useLocation } from '@modern-js/runtime/router';
export default function BridgeStream() {
  const probe =
    new URLSearchParams(useLocation().search).get('probe') || 'stream';
  const [label, setLabel] = useState('Streaming station');
  const [slow, setSlow] = useState(true);
  return (
    <main>
      <h1>Independent Bridge streams</h1>
      <button
        data-testid="stream-rename"
        onClick={() => setLabel('Updated streaming station')}
      >
        Rename
      </button>
      <button data-testid="stream-unmount" onClick={() => setSlow(false)}>
        Unmount pending station
      </button>
      <section data-testid="bridge-fast">
        <ReactRemote
          remote="provider/ProductApp"
          memoryRoute={{ entryPath: `/stream?probe=${probe}-fast` }}
          props={{ label }}
        />
      </section>
      <section data-testid="bridge-slow">
        {slow && (
          <ReactRemote
            remote="provider/ProductApp"
            memoryRoute={{ entryPath: `/stream?probe=${probe}-slow&hold=1` }}
            props={{ label }}
          />
        )}
      </section>
    </main>
  );
}
