import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export async function loader() {
  return 'request profile page';
}

export default function Page() {
  const data = useLoaderData() as string;
  return (
    <div>
      {data}
      <Outlet />
    </div>
  );
}
