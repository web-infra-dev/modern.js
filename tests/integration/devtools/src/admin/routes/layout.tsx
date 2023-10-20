import { Outlet, Link } from '@modern-js/runtime/router';

export default function Layout() {
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Link to="foo">foo</Link>
        <Link to="bar">bar</Link>
        <Link to="bar/baz">bar/baz</Link>
      </div>
      <Outlet />
    </div>
  );
}
