import 'server-only';
import { Link, Outlet } from '@modern-js/runtime/router';
import './layout.css';

export default function Layout() {
  return (
    <div className="root-layout">
      root layout
      <Link className="home-link" to="/">
        home
      </Link>
      <Link className="user-link" to="user">
        user
      </Link>
      <Link className="redirect-link" to="redirect">
        redirect
      </Link>
      <Outlet />
    </div>
  );
}
