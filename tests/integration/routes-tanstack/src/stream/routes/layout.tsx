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
        <Link
          to="/user/$id"
          params={{ id: '123' }}
          prefetch="intent"
          data-testid="link-user"
        >
          user
        </Link>
        <Link to="/optional/{-$id}" data-testid="link-optional-empty">
          optional-empty
        </Link>
        <Link
          to="/optional/{-$id}"
          params={{ id: '456' }}
          data-testid="link-optional"
        >
          optional
        </Link>
        <Link to="/redirect" data-testid="link-redirect">
          redirect
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
