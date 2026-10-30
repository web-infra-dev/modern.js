import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useLocation } from '@modern-js/runtime/router';
import { createReactRemote } from '@modern-js/runtime/mf';
import { createReactRemote as createCoreRemote } from '@module-federation/bridge-react/base';

// A separate React root has no Modern Router context. This exercises the real
// BrowserRemote adapter and Core's supported adapter-free browser consumption.
const BrowserAdapterProduct = createReactRemote({
  remote: 'provider/ProductApp',
  basename: '/admin/browser-consumer/adapter',
});
const DirectProduct = createCoreRemote({
  remote: 'provider/ProductApp',
  basename: '/admin/browser-consumer/direct',
});

export default function BrowserConsumer() {
  const location = useLocation();
  const variant = location.pathname.split('/')[2];
  const container = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    const root = createRoot(container.current!);
    root.render(
      variant === 'direct' ? <DirectProduct /> : <BrowserAdapterProduct />,
    );
    return () => root.unmount();
  }, [variant]);
  return (
    <main data-testid="browser-consumer-root">
      <p data-testid="browser-consumer-host-location">
        {location.pathname}
        {location.search}
        {hydrated && location.hash}
      </p>
      <div ref={container} data-testid="browser-consumer-remote" />
    </main>
  );
}
