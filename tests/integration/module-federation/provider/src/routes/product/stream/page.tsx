import { Suspense, useEffect, useState } from 'react';
import { Await, useLoaderData } from '@modern-js/runtime/router';
export default function StreamStation() {
  const { probe, detail } = useLoaderData() as {
    probe: string;
    detail: Promise<{ detail: string }>;
  };
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <section data-testid="bridge-progressive">
      <h3>{probe}</h3>
      <button
        data-testid="bridge-progressive-count"
        disabled={!ready}
        onClick={() => setCount(value => value + 1)}
      >
        Count: {count}
      </button>
      <Suspense
        fallback={<p data-testid="bridge-pending-detail">Pending detail</p>}
      >
        <Await
          resolve={detail}
          errorElement={
            <p data-testid="bridge-data-error">Detail unavailable</p>
          }
        >
          {value => <p data-testid="bridge-resolved-detail">{value.detail}</p>}
        </Await>
      </Suspense>
    </section>
  );
}
