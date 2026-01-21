import { Helmet } from '@modern-js/runtime/head';
import { Link, Outlet } from '@modern-js/runtime/router';

export default function UserLayout() {
  return (
    <div>
      <Helmet>
        <title>User Section - Async Helmet Test</title>
        <link rel="stylesheet" href="/static/css/user.css" />
      </Helmet>
      User section
      <div>
        <Link to="/user/1" id="user-1-btn">
          User 1
        </Link>
        <Link to="/user/2" id="user-2-btn">
          User 2
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
