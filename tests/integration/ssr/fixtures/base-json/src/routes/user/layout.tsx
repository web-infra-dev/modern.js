import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      User layout
      {<Outlet />}
    </div>
  );
}
