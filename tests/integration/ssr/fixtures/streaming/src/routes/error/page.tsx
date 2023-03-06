import { Await, useAsyncError, useLoaderData } from '@modern-js/runtime/router';
import { Suspense } from 'react';

export default function Page() {
  const data = useLoaderData();

  return (
    <div>
      Error page
      <Suspense fallback={<div>loading ...</div>}>
        <Await resolve={data.data} errorElement={<ErrorElement />}>
          {(data: any) => {
            return <div>never shown</div>;
          }}
        </Await>
      </Suspense>
    </div>
  );
}

function ErrorElement() {
  const error = useAsyncError() as Error;
  return <p>Something went wrong! {error.message}</p>;
}
