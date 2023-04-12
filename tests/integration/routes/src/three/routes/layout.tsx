import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData() as {
    message: string;
  };

  return (
    <div>
      {data?.message}
      <Link to="user" className="user-btn" prefetch="intent">
        /user
      </Link>
      <Link to="user/profile" prefetch="intent">
        /user/profile
      </Link>
      <Link to="error/loader" className="loader-error-btn" prefetch="intent">
        /error/loader
      </Link>
      <Link to="redirect" className="redirect-btn" prefetch="intent">
        /redirect
      </Link>
      <Outlet />
    </div>
  );
}
