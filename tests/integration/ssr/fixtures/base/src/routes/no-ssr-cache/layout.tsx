import { Outlet } from '@modern-js/runtime/router';
import { NoSSRCache } from '@modern-js/runtime/ssr';

export default function Layout() {
  return (
    <div>
      No SSR Cache layout
      <NoSSRCache />
      {<Outlet />}
    </div>
  );
}
