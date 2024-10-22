import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const data = useLoaderData();
  return (
    <div>
      <Outlet />
    </div>
  );
}
