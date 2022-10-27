import { Outlet } from '@modern-js/runtime/runtime-router';

export default function Layout() {
  return (
    <div>
      shop layout
      {<Outlet />}
    </div>
  );
}
