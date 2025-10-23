'use client';

import { Suspense, lazy } from 'react';

// @ts-expect-error remote module provided at runtime
const Counter = lazy(() => import('rsc_csr_remote/CounterClient'));
// @ts-expect-error remote module provided at runtime
const DynamicMessage = lazy(
  () => import('rsc_csr_remote/DynamicMessageClient'),
);
// @ts-expect-error remote module provided at runtime
const Suspended = lazy(() => import('rsc_csr_remote/SuspendedClient'));

export default function ClientRoot() {
  return (
    <>
      <section
        className="remote-section"
        style={{ marginTop: 20, padding: 10, border: '1px solid #ccc' }}
      >
        <h2>Remote Counter Component</h2>
        <Suspense fallback={<div className="loading">Loading Counter...</div>}>
          <Counter />
        </Suspense>
      </section>

      <section
        className="remote-section"
        style={{ marginTop: 20, padding: 10, border: '1px solid #ccc' }}
      >
        <h2>Remote Dynamic Message</h2>
        <Suspense fallback={<div className="loading">Loading Message...</div>}>
          <DynamicMessage />
        </Suspense>
      </section>

      <section
        className="remote-section"
        style={{ marginTop: 20, padding: 10, border: '1px solid #ccc' }}
      >
        <h2>Remote Suspended Component</h2>
        <Suspense
          fallback={<div className="loading">Loading Suspended...</div>}
        >
          <Suspended />
        </Suspense>
      </section>
    </>
  );
}
