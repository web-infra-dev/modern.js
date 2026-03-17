'use client';

import { Outlet } from '@modern-js/runtime/router';

export default function ClientOnlyLayout() {
  return (
    <div className="client-only-layout">
      <Outlet />
    </div>
  );
}
