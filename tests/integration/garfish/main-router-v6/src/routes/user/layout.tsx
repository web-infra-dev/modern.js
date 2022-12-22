import { Outlet, useLoaderData } from '@modern-js/runtime/router';
import { useModuleApps } from '@modern-js/runtime/garfish';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const loader = async () => {
  await wait(10);
  return {
    message: 'user layout',
  };
};

export default function Layout() {
  const { Dashboard } = useModuleApps();
  const data = useLoaderData() as { message: string };
  // console.log('xxxxx', useMatches())
  return (
    <div>
      {data.message}
      <Dashboard
        msg={'hello world from main app'}
        loadable={{
          loading: ({ _pastDelay, error }: any) => {
            if (error) {
              return <div>error: {error?.message}</div>;
            } else {
              return <div>dashboard loading</div>;
            }
          },
        }}
      />
      {<Outlet />}
    </div>
  );
}
