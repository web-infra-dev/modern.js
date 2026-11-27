import { useLoaderData, useLocation } from '@modern-js/runtime/router';

export default function MemoryUserDetail() {
  const data = useLoaderData() as { id: string; tab: string };
  const location = useLocation();
  const from =
    location.state &&
    typeof location.state === 'object' &&
    'from' in location.state
      ? String((location.state as { from: unknown }).from)
      : '';

  return (
    <section data-testid="memory-user">
      <p data-testid="memory-user-data">
        user:{data.id}:{data.tab}
      </p>
      <p data-testid="memory-user-state">{from}</p>
    </section>
  );
}
