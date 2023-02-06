import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData() as {
    message: string;
  };
  return (
    <div>
      {data?.message}
      <Link to="user" className="user-btn">
        /user
      </Link>
      <Link to="user/profile"> /user/profile </Link>
      <Link to="error/loader" className="loader-error-btn">
        /error/loader
      </Link>
      <Link to="redirect" className="redirect-btn">
        /redirect
      </Link>
      <Outlet />
    </div>
  );
}
