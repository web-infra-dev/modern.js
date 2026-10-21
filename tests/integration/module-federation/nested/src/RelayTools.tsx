import { lazy, Suspense } from 'react';
const Ping = lazy(() => import('./Ping'));
const Pulse = lazy(() => import('./Pulse'));
export default function RelayTools() {
  return (
    <div className="relay-tools">
      <Suspense fallback={<p>Loading relay tools…</p>}>
        <Ping />
        <Pulse />
      </Suspense>
    </div>
  );
}
