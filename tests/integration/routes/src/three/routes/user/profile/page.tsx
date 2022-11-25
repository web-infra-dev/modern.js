import { Outlet, useLoaderData } from '@modern-js/runtime/router';
import { readFile } from './utils.server';
// import { readFile } from 'fs-extra';

export async function loader() {
  // eslint-disable-next-line no-console
  console.log(readFile.toString());
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
