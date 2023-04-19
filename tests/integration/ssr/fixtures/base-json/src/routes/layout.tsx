import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      Root layout
      <div>
        <Link to="/user/1" id="user-btn">
          Go User 1
        </Link>
        <Link to="/error" id="error-btn">
          Go Error
        </Link>
        <Link to="/redirect" id="redirect-btn">
          Go Redirect
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
