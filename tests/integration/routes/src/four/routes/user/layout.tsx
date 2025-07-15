import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData() as { message: string };
  return (
    <div>
      {data.message}
      {<Outlet />}
    </div>
  );
}
