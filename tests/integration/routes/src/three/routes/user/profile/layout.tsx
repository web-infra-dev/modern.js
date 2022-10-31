import { Outlet, defer } from '@modern-js/runtime/router';

const wait = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

export async function loader() {
  const getInfo = async () => {
    await wait(1000);
    return 'profile info';
  };

  return defer({
    profileInfo: getInfo(),
  });
}

export default function Layout() {
  return (
    <div>
      profile layout
      <Outlet />
    </div>
  );
}
