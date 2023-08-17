import { Link, Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div style={{ height: '100%' }}>
      <div style={{ position: 'sticky', top: 10 }}>
        <Link to="./framework">
          <button>Framework</button>
        </Link>
        <Link to="./builder">
          <button>Builder</button>
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
