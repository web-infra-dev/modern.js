import { Outlet } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import { StoreContextProvider } from '@/stores';

export default function Layout() {
  return (
    <div>
      <Suspense fallback={<div>loading...</div>}>
        <StoreContextProvider>
          <Outlet />
        </StoreContextProvider>
      </Suspense>
    </div>
  );
}
