import { Outlet, useLoaderData } from '@modern-js/runtime/router';
// import { readFile } from './utils.server';
// import { readFile } from 'fs-extra';

export async function loader() {
  // console.log(readFile.toString());
  return 'request profile page';
}

export default function Page() {
  const data = useLoaderData() as string;
  return (
    <div className="user-profile">
      {data}
      <Outlet />
    </div>
  );
}
