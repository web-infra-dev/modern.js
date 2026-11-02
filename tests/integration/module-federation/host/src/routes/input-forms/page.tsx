import { useEffect, useState } from 'react';
import { createReactRemote, ReactRemote } from '@modern-js/runtime/mf';
import { loadRemote } from '@module-federation/enhanced/runtime';
import Shop, * as ShopModule from 'provider/InputCard';
import type { InputCardProps } from 'provider/InputCard';
import Forecast, * as ForecastModule from 'provider/Forecast';

const sources = [
  { name: 'alias', remote: 'provider/InputCard' },
  {
    name: 'mf-loader',
    remote: () => loadRemote<typeof ShopModule>('provider/InputCard'),
  },
  { name: 'namespace', remote: () => ShopModule },
  { name: 'async-namespace', remote: async () => ShopModule },
  { name: 'default', remote: () => Shop },
  { name: 'async-default', remote: async () => Shop },
] as const;
const forms = sources.map(source => ({
  ...source,
  Factory: createReactRemote<InputCardProps>({
    remote: source.remote,
    loading: <p>Loading {source.name}</p>,
  }),
}));
const PreloadedForecast = createReactRemote({ remote: () => Forecast });
const preloadedForecastModule = async () => ForecastModule;
const clientSource = async () => {
  if (typeof window === 'undefined')
    throw new Error('CLIENT_LOADER_EXECUTED_ON_SERVER');
  return Shop;
};
const ClientFactory = createReactRemote<InputCardProps>({
  remote: clientSource,
  noSSR: true,
  loading: (
    <p data-testid="input-no-ssr-placeholder">Waiting for client input</p>
  ),
});
const BridgeFactory = createReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/BridgeCard'),
  loading: (
    <p data-testid="input-bridge-placeholder">
      Waiting for independent station
    </p>
  ),
});
function retrySource() {
  let attempted = false;
  return async () => {
    if (!attempted) {
      attempted = true;
      throw new Error('INPUT_SOURCE_FAILED_ONCE');
    }
    return Shop;
  };
}
const factoryRetrySource = retrySource();
const declarativeRetrySource = retrySource();
const RetryFactory = createReactRemote<InputCardProps>({
  remote: factoryRetrySource,
  noSSR: true,
  fallback: ({ error, retry }) => (
    <button data-testid="input-retry-factory" onClick={retry}>
      {error.message}
    </button>
  ),
});

export default function InputForms() {
  const [label, setLabel] = useState('Lakeside inputs');
  const [retryVisible, setRetryVisible] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.inputFormsReady = 'true';
    return () => {
      delete document.documentElement.dataset.inputFormsReady;
    };
  }, []);
  return (
    <main>
      <h1>Weather remote input forms</h1>
      <button
        data-testid="input-rename"
        onClick={() => setLabel('Hilltop inputs')}
      >
        Rename stations
      </button>
      <button
        data-testid="input-show-retry"
        onClick={() => setRetryVisible(true)}
      >
        Try failed sources
      </button>
      {forms.map(({ name, remote, Factory }) => (
        <section key={name}>
          <h2>{name}</h2>
          <Factory label={label} instance={`factory-${name}`} />
          <ReactRemote<InputCardProps>
            remote={remote}
            props={{ label, instance: `declarative-${name}` }}
          />
        </section>
      ))}
      <PreloadedForecast id="input-preloaded-forecast" />
      <ReactRemote
        remote={preloadedForecastModule}
        props={{ id: 'input-preloaded-forecast-module' }}
      />
      <ClientFactory label={label} instance="factory-no-ssr" />
      <ReactRemote<InputCardProps>
        remote={clientSource}
        noSSR
        loading={
          <p data-testid="input-declarative-no-ssr-placeholder">
            Waiting for client input
          </p>
        }
        props={{ label, instance: 'declarative-no-ssr' }}
      />
      <section data-testid="input-bridge-factory">
        <BridgeFactory label={label} />
      </section>
      <section data-testid="input-bridge-declarative">
        <ReactRemote
          remote="provider/BridgeCard"
          loading={<p>Waiting for independent station</p>}
          props={{ label }}
        />
      </section>
      {retryVisible && (
        <>
          <RetryFactory label={label} instance="factory-retried" />
          <ReactRemote<InputCardProps>
            remote={declarativeRetrySource}
            noSSR
            fallback={({ error, retry }) => (
              <button data-testid="input-retry-declarative" onClick={retry}>
                {error.message}
              </button>
            )}
            props={{ label, instance: 'declarative-retried' }}
          />
        </>
      )}
    </main>
  );
}
