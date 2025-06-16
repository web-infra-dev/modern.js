import 'server-only';
import { Link, Outlet } from '@modern-js/runtime/router/browser';
export default function Layout() {
  return (
    <div>
      layout
      <Link to="user">user</Link>
      <Outlet />
    </div>
  );
}
