import { Outlet } from '@modern-js/runtime/router';

export default function Page() {
  return (
    <div>
      profile page
      <Outlet />
    </div>
  );
}
