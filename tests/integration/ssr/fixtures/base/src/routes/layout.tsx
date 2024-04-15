import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const { count } = useLoaderData() as { count: number };

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
        <Link to="/context" id="context-btn">
          Go Context
        </Link>
      </div>
      <Outlet />
      <footer>{`count:${count}`}</footer>
    </div>
  );
}
