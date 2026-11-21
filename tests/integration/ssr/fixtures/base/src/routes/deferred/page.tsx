import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

type Data = { call: number; fast: string; slow: string; broken: string };

const Region = ({ id, value }: { id: string; value: unknown }) => (
  <Suspense fallback={<p id={id}>loading</p>}>
    <Await resolve={value} errorElement={<p id={id}>error</p>}>
      {(text: string) => <p id={id}>{text}</p>}
    </Await>
  </Suspense>
);

export default function Page() {
  const data = useLoaderData() as Data;
  return (
    <main>
      <p id="call">call {data.call}</p>
      <Region id="fast" value={data.fast} />
      <Region id="slow" value={data.slow} />
      <Region id="broken" value={data.broken} />
    </main>
  );
}
