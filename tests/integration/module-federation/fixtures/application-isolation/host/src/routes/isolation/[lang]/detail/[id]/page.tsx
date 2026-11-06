import { useLoaderData } from '@modern-js/runtime/router';

export default function Detail() {
  const data = useLoaderData() as { source: string; id: string };
  return (
    <p data-testid="isolation-host-detail">
      {data.source}:{data.id}
    </p>
  );
}
