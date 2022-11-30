import { Outlet, useLoaderData } from '@modern-js/runtime/router';

import type { LoaderFunction } from '@modern-js/runtime/router';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const loader: LoaderFunction = async ({ request }) => {
  await wait(200);
  return {
    message: 'hello user',
  };
};

export default function Layout() {
  const data = useLoaderData() as {
    message: string;
  };
  return (
    <div>
      <span>{`${data?.message} layout`}</span>
      {<Outlet />}
    </div>
  );
}
