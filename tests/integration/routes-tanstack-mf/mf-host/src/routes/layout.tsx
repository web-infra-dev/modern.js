import { Link, Outlet, useMatch } from '@modern-js/runtime/tanstack-router';

export default function Layout() {
  const match = useMatch({ from: '__root__' });
  const message = match.loaderData!.message;

  return (
    <div id="root">
      <div id="layout-msg">{message}</div>
      <nav>
        <Link to="/" data-testid="link-home">
          home
        </Link>
        <Link to="/mf" data-testid="link-mf">
          mf
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
