import { PrefetchLink, Outlet, useLoaderData } from '@modern-js/runtime/router';

export default function Layout() {
  const data = useLoaderData() as {
    message: string;
  };

  return (
    <div>
      {data?.message}
      <PrefetchLink to="user" className="user-btn" prefetch="intent">
        /user
      </PrefetchLink>
      <PrefetchLink to="user/profile" prefetch="intent">
        /user/profile
      </PrefetchLink>
      <PrefetchLink
        to="error/loader"
        className="loader-error-btn"
        prefetch="intent"
      >
        /error/loader
      </PrefetchLink>
      <PrefetchLink to="redirect" className="redirect-btn" prefetch="intent">
        /redirect
      </PrefetchLink>
      <Outlet />
    </div>
  );
}
