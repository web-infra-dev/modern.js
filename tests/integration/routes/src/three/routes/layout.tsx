import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      root layout
      <Link to="user">/user</Link>
      <Link to="user/profile">/user/profile</Link>
      <Outlet />
    </div>
  );
}
