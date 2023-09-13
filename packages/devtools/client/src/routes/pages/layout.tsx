import { Outlet } from '@modern-js/runtime/router';
import { ScrollArea } from '@radix-ui/themes';
import { Suspense } from 'react';

export default function Layout() {
  return (
    <ScrollArea scrollbars="both">
      <Suspense fallback={'loading...'}>
        <Outlet />
      </Suspense>
    </ScrollArea>
  );
}
