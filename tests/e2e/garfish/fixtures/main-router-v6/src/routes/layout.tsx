import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      <div>Main App</div>
      <Link id={'renderMicroApp'} to="/dashboard">
        render dashboard
      </Link>
      <Outlet />
    </div>
  );
}
