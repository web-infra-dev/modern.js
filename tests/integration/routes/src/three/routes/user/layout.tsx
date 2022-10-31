import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      user layout
      {<Outlet />}
    </div>
  );
}
