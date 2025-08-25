import type { RuntimeContext } from '@modern-js/runtime';
import { Link, Outlet } from '@modern-js/runtime/router';

declare global {
  interface Window {
    __isBrowser: boolean;
  }
}

export default function Layout() {
  return (
    <div>
      root layout
      <Link to="/user" prefetch="intent">
        /user
      </Link>
      <Link to="/user/profile" prefetch="intent">
        /user/profile
      </Link>
      <Link to="user/111">/user/111</Link>
      <Link className="should-not-revalidate" to="user/222?revalidate=false">
        /user/222
      </Link>
      <Outlet />
    </div>
  );
}
