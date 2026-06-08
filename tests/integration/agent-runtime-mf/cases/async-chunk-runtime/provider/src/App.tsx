import { Suspense, lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

let GarfishOrderSensitive: LazyExoticComponent<ComponentType> | null = null;

if (__ASYNC_CHUNK_RUNTIME_BUILD__ !== 'remote') {
  GarfishOrderSensitive = lazy(
    () =>
      import(
        /* webpackChunkName: "rivendell-order-sensitive" */
        './async/GarfishOrderSensitive'
      ),
  );
}

export default function RivendellGarfishApp() {
  return (
    <section data-testid="garfish-rivendell-subapp">
      <h1>Garfish Sub</h1>
      {GarfishOrderSensitive ? (
        <Suspense fallback={<div>Loading Garfish async chunk...</div>}>
          <GarfishOrderSensitive />
        </Suspense>
      ) : null}
    </section>
  );
}
