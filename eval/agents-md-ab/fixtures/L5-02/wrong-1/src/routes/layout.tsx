import { useEffect } from 'react';
import { useRuntimeContext } from '@modern-js/runtime';
import { Outlet } from '@modern-js/runtime/router';

export default function Layout() {
  const { context } = useRuntimeContext();
  useEffect(() => {
    console.log('is-browser', context.isBrowser);
  }, [context]);
  return (
    <div>
      <Outlet />
    </div>
  );
}
