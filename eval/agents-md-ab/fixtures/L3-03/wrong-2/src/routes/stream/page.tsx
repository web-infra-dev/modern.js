import { Suspense } from 'react';
import { Await, useLoaderData } from '@modern-js/runtime/router';

const StreamPage = () => {
  const data = useLoaderData() as { slow: Promise<string> };
  return (
    <Suspense fallback={<div>loading...</div>}>
      <Await resolve={data.slow}>{(value: string) => <div>{value}</div>}</Await>
    </Suspense>
  );
};

export default StreamPage;
