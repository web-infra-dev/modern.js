import { useLoaderData, useLocation } from '@modern-js/runtime/router';

export default function MemoryDemoDetail() {
  const data = useLoaderData() as { id: string; tab: string; probe: string };
  const location = useLocation();
  const from =
    location.state &&
    typeof location.state === 'object' &&
    'from' in location.state
      ? String((location.state as { from: unknown }).from)
      : '';

  return (
    <section data-testid="memory-demo-detail">
      <p data-testid="memory-demo-detail-data">
        detail:{data.id}:{data.tab}:{data.probe}
      </p>
      <p data-testid="memory-demo-detail-state">{from}</p>
    </section>
  );
}
