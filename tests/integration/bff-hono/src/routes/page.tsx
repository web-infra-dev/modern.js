import { Await, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import type { Data } from './page.loader';

const Page = () => {
  const data = useLoaderData() as Data;
  return (
    <div id="item">
      ctx.req info:
      <Suspense fallback={<div id="loading">loading user data ...</div>}>
        <Await resolve={data.data}>
          {ctx => {
            return <div id="data">path: {ctx.path}</div>;
          }}
        </Await>
      </Suspense>
    </div>
  );
};

export default Page;
