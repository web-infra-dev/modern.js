import { Outlet } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import SidePanel from './SidePanel';
import { StoreContextProvider } from '@/stores';

export default function Layout() {
  return (
    <StoreContextProvider>
      <div>
        <SidePanel />
        <Suspense fallback={<div>loading...</div>}>
          <Outlet />
        </Suspense>
      </div>
    </StoreContextProvider>
  );
}
