import { Outlet } from '@modern-js/runtime/runtime-router';

export default function Page() {
  return (
    <div>
      profile page
      <Outlet />
    </div>
  );
}
