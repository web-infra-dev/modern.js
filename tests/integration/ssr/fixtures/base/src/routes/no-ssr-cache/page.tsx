import { Outlet } from '@modern-js/runtime/router';

export default function Page() {
  return (
    <div>
      No SSR Cache
      <Outlet />
    </div>
  );
}
