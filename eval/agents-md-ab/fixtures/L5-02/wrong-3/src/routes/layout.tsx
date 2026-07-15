import { use, useEffect } from 'react';
import { RuntimeContext } from '@modern-js/runtime';
import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  const { isBrowser } = use(RuntimeContext);
  useEffect(() => {
    console.log('isBrowser', isBrowser);
  }, [isBrowser]);
  return (
    <div>
      <Outlet />
    </div>
  );
}
