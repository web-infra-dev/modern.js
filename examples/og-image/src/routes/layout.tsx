import { Link, Outlet } from '@modern-js/runtime/router';
import './style.css';

export default function Layout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          Modern.js Journal
        </Link>
        <span>Ideas into experiences</span>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        Built with Modern.js · A server-rendered publishing example
      </footer>
    </div>
  );
}
