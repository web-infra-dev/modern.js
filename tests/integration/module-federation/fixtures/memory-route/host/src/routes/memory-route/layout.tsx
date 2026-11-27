import { createModernReactRemote } from '@modern-js/runtime/mf';
import { Link, Outlet, useLocation } from '@modern-js/runtime/router';
import { loadRemote } from '@module-federation/enhanced/runtime';
import { useEffect } from 'react';

const PersistentRemote = createModernReactRemote<{ label: string }>({
  remote: () => loadRemote('provider/MemoryRouteApp'),
  memoryRoute: {
    entryPath: '/',
    basename: '/dock',
  },
});

export default function MemoryRouteHostLayout() {
  const location = useLocation();
  useEffect(() => {
    document.documentElement.dataset.memoryRouteReady = 'true';
  }, []);

  return (
    <main data-testid="memory-host-layout">
      <p data-testid="memory-host-url">
        {location.pathname}
        {location.search}
      </p>
      <nav>
        <Link data-testid="memory-host-to-alpha" to="/memory-route/alpha">
          Alpha
        </Link>
        <Link data-testid="memory-host-to-beta" to="/memory-route/beta">
          Beta
        </Link>
      </nav>
      <section data-testid="memory-panel-persistent">
        <PersistentRemote label="persistent" />
      </section>
      <Outlet />
    </main>
  );
}
