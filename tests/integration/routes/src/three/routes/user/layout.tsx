import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData() as string;
  return (
    <div>
      <span>{data}</span>
      {<Outlet />}
    </div>
  );
}
