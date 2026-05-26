import { Suspense, lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

let RemoteOrderSensitive: LazyExoticComponent<ComponentType> | null = null;

if (__ASYNC_CHUNK_RUNTIME_BUILD__ !== 'garfish') {
  RemoteOrderSensitive = lazy(
    () =>
      import(
        /* webpackChunkName: "rivendell-order-sensitive" */
        './async/RemoteOrderSensitive'
      ),
  );
}

console.log('RemotePanel render');
export default function RemotePanel() {
  return (
    <section data-testid="remote-panel">
      <h1>MF Expose</h1>
      {RemoteOrderSensitive ? (
        <Suspense fallback={<div>Loading remote async chunk...</div>}>
          <RemoteOrderSensitive />
        </Suspense>
      ) : null}
    </section>
  );
}
