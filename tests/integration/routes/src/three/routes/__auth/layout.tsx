import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      auth layout
      {<Outlet />}
    </div>
  );
}
