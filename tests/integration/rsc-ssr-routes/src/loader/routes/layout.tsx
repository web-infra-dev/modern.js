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
      <Link className="match-link" to="match/123">
        match
      </Link>
      <Link className="client-only-link" to="client-only">
        client only
      </Link>
      <Link
        className="client-only-with-loader-link"
        to="client-only-with-loader"
      >
        client only with loader
      </Link>
      <Outlet />
    </div>
  );
}
