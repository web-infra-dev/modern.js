import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = useLoaderData();
  return (
    <div>
      <Outlet />
    </div>
  );
}
