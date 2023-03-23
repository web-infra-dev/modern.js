import { useLoaderData } from '@modern-js/runtime/router';
import { useModuleApps } from '@modern-js/plugin-garfish/runtime';

export default function Layout() {
  const { Dashboard } = useModuleApps();
  const data = useLoaderData() as { message: string };

  return (
    <div>
      <div>---------</div>
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
    </div>
  );
}
