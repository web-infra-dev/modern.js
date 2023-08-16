import { Outlet } from '@modern-js/runtime/router';
import { Suspense } from 'react';
import SidePanel from './SidePanel';
import styles from './layout.module.scss';
import { StoreContextProvider } from '@/stores';

export default function Layout() {
  return (
    <StoreContextProvider>
      <div>
        <div className={styles.nav}>
          <SidePanel />
        </div>
        <div className={styles.outletContainer}>
          <Suspense fallback={<div>loading...</div>}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </StoreContextProvider>
  );
}
