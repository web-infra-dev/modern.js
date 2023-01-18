import { Outlet, useLoaderData } from '@modern-js/runtime/router';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const loader = async () => {
  await wait(10);
  return {
    message: 'user layout',
  };
};

export default function Layout() {
  const data = useLoaderData() as { message: string };
  // console.log('xxxxx', useMatches())
  return (
    <div>
      {data.message}

      {<Outlet />}
    </div>
  );
}
