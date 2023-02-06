import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const data = useLoaderData() as string;
  return (
    <div className="user-profile">
      {data}
      <Outlet />
    </div>
  );
}
