import { useState } from 'react';
import { createBridgeComponent } from '@modern-js/runtime/mf';

function BridgeCard({ label = 'Remote application' }: { label?: string }) {
  const [count, setCount] = useState(0);
  return (
    <section data-testid="unified-bridge">
      <p>{label}</p>
      <button onClick={() => setCount(value => value + 1)}>
        Bridge count: {count}
      </button>
    </section>
  );
}

export default createBridgeComponent({ rootComponent: BridgeCard });
