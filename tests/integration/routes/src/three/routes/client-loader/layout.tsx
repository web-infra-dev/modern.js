import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData();
  return (
    <div>
      <span className="client-loader-layout">{`${data}`}</span>
      {<Outlet />}
    </div>
  );
}
