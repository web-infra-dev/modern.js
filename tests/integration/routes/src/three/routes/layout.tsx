import { Link, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData() as {
    message: string;
  };

  return (
    <div>
      {data?.message}
      <Link to="/" className="root-btn" prefetch="intent">
        /home
      </Link>
      <Link to="user" className="user-btn" prefetch="intent">
        /user
      </Link>
      <Link to="user/profile" className="user-profile-btn" prefetch="intent">
        /user/profile
      </Link>
      <Link to="error/loader" className="loader-error-btn" prefetch="intent">
        /error/loader
      </Link>
      <Link
        to="error/response"
        className="loader-error-response"
        prefetch="intent"
      >
        /error/response
      </Link>
      <Link to="redirect" className="redirect-btn" prefetch="intent">
        /redirect
      </Link>
      <Link to="client-loader" className="client-loader-btn" prefetch="intent">
        /client-loader
      </Link>
      <Link to="user/revalidate">/user/revalidate</Link>
      <Link className="should-revalidate" to="user/111">
        /user/111
      </Link>
      <Link
        className="should-not-revalidate"
        to="user/222?revalidate=false"
        prefetch="intent"
      >
        /user/222
      </Link>
      <Outlet />
    </div>
  );
}
