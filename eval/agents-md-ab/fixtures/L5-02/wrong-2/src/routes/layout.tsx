import { useContext, useEffect } from 'react';
import { RuntimeContext } from '@modern-js/runtime';
import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  const context = useContext(RuntimeContext);
  useEffect(() => {
    console.log('is-browser', context.isBrowser);
  }, [context]);
  return (
    <div>
      <Outlet />
    </div>
  );
}
