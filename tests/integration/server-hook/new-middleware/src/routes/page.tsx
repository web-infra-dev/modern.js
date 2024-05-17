import { useLoaderData } from '@modern-js/runtime/router';

export default function Page() {
  const { name } = useLoaderData() as { name: string };

  return <div>Hello {name}</div>;
}
