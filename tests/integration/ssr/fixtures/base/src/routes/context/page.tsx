import { useLoaderData } from '@modern-js/runtime/router';
import type { LoaderData } from './page.loader';

export default function Page() {
  const { reporter } = useLoaderData() as unknown as LoaderData;

  return <div>{reporter}</div>;
}
