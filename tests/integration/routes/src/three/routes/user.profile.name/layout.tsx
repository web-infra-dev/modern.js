import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      user profile name layout
      <Outlet />
    </div>
  );
}
