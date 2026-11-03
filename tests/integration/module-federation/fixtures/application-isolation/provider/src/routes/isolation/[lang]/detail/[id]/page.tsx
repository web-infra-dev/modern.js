import { useLoaderData } from '@modern-js/runtime/router';

export default function Detail() {
  const data = useLoaderData() as { source: string; id: string; probe: string };
  return (
    <p data-testid="isolation-producer-detail">
      {data.source}:{data.id}:{data.probe}
    </p>
  );
}
