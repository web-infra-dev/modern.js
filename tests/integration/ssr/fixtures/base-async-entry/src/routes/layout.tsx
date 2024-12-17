import { Outlet } from '@modern-js/runtime/router';
import './index.css';

export default function Layout() {
  return (
    <div>
      Root layout
      <Outlet />
    </div>
  );
}
