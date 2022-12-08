import { Outlet, useLoaderData } from '@modern-js/runtime/router';

export const loader = () => {
  console.log('throw');
  throw new Error('loader error');
};

export default function Page() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = useLoaderData();
  return (
    <div>
      <Outlet />
    </div>
  );
}
