import 'server-only';
import { getRequest } from '@modern-js/runtime';
import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  const request = getRequest();
  return (
    <div className="root-layout">
      root layout
      <Link className="home-link" to="/">
        home
      </Link>
      <Link className="user-link" to="user">
        user
      </Link>
      <div className="request-url">{request.url}</div>
      <Outlet />
    </div>
  );
}
