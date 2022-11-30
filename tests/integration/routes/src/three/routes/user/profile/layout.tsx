import { Outlet, useLoaderData } from '@modern-js/runtime/router';

const wait = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

export async function loader() {
  await wait(200);
  return 'request profile layout999';
}

export default function Layout() {
  const data = useLoaderData() as string;
  return (
    <div>
      {data}
      <Outlet />
    </div>
  );
}
