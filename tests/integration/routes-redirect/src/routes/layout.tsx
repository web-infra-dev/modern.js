import { Outlet, useLoaderData } from '@modern-js/runtime/router';

type LayoutData = {
  key1: {
    subkey1: string;
  };
  key2: string;
};

const Layout = (): JSX.Element => {
  const loaderData = useLoaderData() as LayoutData;
  console.log({ loaderData });
  console.log(loaderData.key1.subkey1);
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default Layout;
