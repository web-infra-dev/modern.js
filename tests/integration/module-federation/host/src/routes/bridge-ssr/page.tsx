import { useEffect, useState } from 'react';
import { createReactRemote, ReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import Shop, * as ShopModule from 'provider/ProductApp';

const sources = [
  { name: 'string', remote: 'provider/ProductApp' },
  {
    name: 'loader',
    remote: () => loadRemote<typeof ShopModule>('provider/ProductApp'),
  },
  { name: 'preloaded', remote: () => Shop },
] as const;
const memoryRoute = { entryPath: '/' };
const forms = sources.map(source => ({
  ...source,
  Factory: createReactRemote<{ label: string }>({
    remote: source.remote,
    memoryRoute,
  }),
}));
const ClientOnly = createReactRemote({
  remote: () => {
    if (typeof window === 'undefined')
      throw new Error('BRIDGE_NO_SSR_LOADER_CALLED');
    return Shop;
  },
  noSSR: true,
  memoryRoute,
  loading: <p data-testid="bridge-client-placeholder">Client station</p>,
});

export default function BridgeSSR() {
  const [label, setLabel] = useState('Server station');
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    document.documentElement.dataset.bridgeHostReady = 'true';
    return () => {
      delete document.documentElement.dataset.bridgeHostReady;
    };
  }, []);
  return (
    <main>
      <h1>Bridge server rendering</h1>
      <button
        data-testid="bridge-rename"
        onClick={() => setLabel('Updated station')}
      >
        Rename
      </button>
      <button
        data-testid="bridge-toggle"
        onClick={() => setMounted(value => !value)}
      >
        Toggle
      </button>
      {forms.map(({ name, remote, Factory }) => (
        <section key={name} data-testid={`bridge-input-${name}`}>
          {mounted && <Factory label={`${label} factory ${name}`} />}
          <ReactRemote
            remote={remote}
            memoryRoute={memoryRoute}
            props={{ label: `${label} declarative ${name}` }}
          />
        </section>
      ))}
      <section data-testid="bridge-client-only">
        <ClientOnly label="Client only station" />
      </section>
    </main>
  );
}
