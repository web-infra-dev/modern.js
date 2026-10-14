import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      <Link to="module-error" className="module-error-link" prefetch="none">
        Module error
      </Link>
      <Link to="network-error" className="network-error-link" prefetch="none">
        Network error
      </Link>
      <Outlet />
    </div>
  );
}
